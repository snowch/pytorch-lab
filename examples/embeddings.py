import torch
from torch import nn

table = nn.Embedding(5, 3, padding_idx=0)
with torch.no_grad():
    table.weight.copy_(torch.arange(15, dtype=torch.float32).reshape(5, 3))
    table.weight[0].zero_()

token_ids = torch.tensor([[2, 3, 2, 0]])
vectors = table(token_ids)
vectors.sum().backward()
print("embedding shape:", tuple(vectors.shape))
print("vectors:", vectors.tolist())
print("row gradients:", table.weight.grad.tolist())

torch.testing.assert_close(table.weight.grad[2], torch.full((3,), 2.))
torch.testing.assert_close(table.weight.grad[0], torch.zeros(3))
