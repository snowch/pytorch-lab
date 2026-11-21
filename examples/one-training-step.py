import torch
from torch import nn

x = torch.tensor([[1., 0.], [0., 1.], [1., 1.]])
target = torch.tensor([[2.], [-1.], [1.]])
model = nn.Linear(2, 1)
with torch.no_grad():
    model.weight.zero_()
    model.bias.zero_()
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
loss_fn = nn.MSELoss()

optimizer.zero_grad(set_to_none=True)
prediction = model(x)
before = loss_fn(prediction, target)
before.backward()
print("prediction shape:", tuple(prediction.shape))
print("weight gradient:", model.weight.grad.tolist())
optimizer.step()
with torch.no_grad():
    after = loss_fn(model(x), target)
print("loss before:", before.item())
print("loss after:", after.item())
assert after.item() < before.item()
