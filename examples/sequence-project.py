import json

import torch
from torch import nn
from torch.nn import functional as F


class TinyDecoder(nn.Module):
    def __init__(self, vocabulary=8, length=5, width=16):
        super().__init__()
        self.tokens = nn.Embedding(vocabulary, width)
        self.positions = nn.Embedding(length, width)
        self.qkv = nn.Linear(width, 3 * width)
        self.norm = nn.LayerNorm(width)
        self.output = nn.Linear(width, vocabulary)

    def forward(self, ids):
        x = self.tokens(ids) + self.positions(torch.arange(ids.size(1), device=ids.device))
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        context = F.scaled_dot_product_attention(
            q.unsqueeze(1), k.unsqueeze(1), v.unsqueeze(1), is_causal=True
        ).squeeze(1)
        return self.output(self.norm(x + context))


torch.manual_seed(8)
model = TinyDecoder()
optimizer = torch.optim.Adam(model.parameters(), lr=0.025)
# In A B A B A B, the initial token alone cannot determine the next one.
# Hold out entire ordered pairs so evaluation requires copying from context.
train_pairs = [(a, b) for a in range(8) for b in range(8)
               if a != b and (b - a) % 8 != 1]
test_pairs = [(a, (a + 1) % 8) for a in range(8)]


def sequences(pairs):
    return torch.tensor([[a, b] * 3 for a, b in pairs])


tokens = sequences(train_pairs)
history = []
for _ in range(55):
    optimizer.zero_grad(set_to_none=True)
    logits = model(tokens[:, :-1])
    # Skip the first position, whose next token cannot be inferred.
    loss = F.cross_entropy(logits[:, 1:].reshape(-1, 8), tokens[:, 2:].reshape(-1))
    loss.backward()
    optimizer.step()
    history.append(loss.item())

held_out = sequences(test_pairs)
model.eval()
with torch.inference_mode():
    logits = model(held_out[:, :-1])
    predictions = logits[:, 1:].argmax(dim=-1)
    accuracy = (predictions == held_out[:, 2:]).float().mean().item()
    changed = held_out[:, :-1].clone()
    changed[:, 3:] = (changed[:, 3:] + 3) % 8
    torch.testing.assert_close(model(changed)[:, :3], logits[:, :3])
print("held-out accuracy on predictable positions:", round(accuracy, 3))
print("example input:", held_out[0, :-1].tolist())
print("next-token predictions from position 1:", predictions[0].tolist())
print("LAB_CURVE " + json.dumps([{"label": "Training cross-entropy", "values": history}]))

assert history[-1] < 0.3 * history[0]
assert accuracy >= 0.75
