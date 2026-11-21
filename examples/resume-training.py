import io

import torch
from torch import nn


def step(model, optimizer):
    x = torch.tensor([[1.], [2.]])
    y = 3 * x - 1
    optimizer.zero_grad(set_to_none=True)
    loss = (model(x) - y).square().mean()
    loss.backward()
    optimizer.step()
    return loss.item()


torch.manual_seed(6)
direct = nn.Linear(1, 1)
optimizer = torch.optim.SGD(direct.parameters(), lr=0.025, momentum=0.9)
step(direct, optimizer)
checkpoint = io.BytesIO()
torch.save({"model": direct.state_dict(), "optimizer": optimizer.state_dict()}, checkpoint)
direct_loss = step(direct, optimizer)

checkpoint.seek(0)
state = torch.load(checkpoint, map_location="cpu", weights_only=True)
restored = nn.Linear(1, 1)
restored.load_state_dict(state["model"])
resumed_optimizer = torch.optim.SGD(restored.parameters(), lr=0.025, momentum=0.9)
resumed_optimizer.load_state_dict(state["optimizer"])
resumed_loss = step(restored, resumed_optimizer)

print("next loss before update:", direct_loss, resumed_loss)
print("direct weight:", direct.weight.item(), "| resumed weight:", restored.weight.item())
for name, parameter in direct.state_dict().items():
    torch.testing.assert_close(parameter, restored.state_dict()[name])
