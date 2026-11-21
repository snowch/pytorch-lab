import torch
from torch import nn

torch.manual_seed(21)
model = nn.Sequential(nn.Linear(2, 4), nn.ReLU(), nn.Dropout(0.5), nn.Linear(4, 2))
inputs = torch.tensor([[1., -1.], [0., 2.], [1., 1.]])
labels = torch.tensor([0, 1, 0])

model.train()
training = model(inputs)
model.eval()
evaluation_with_grad = model(inputs)
with torch.inference_mode():
    evaluation = model(inputs)
    predictions = evaluation.argmax(dim=1)
    correct = (predictions == labels).sum().item()

print("train() tracks gradients:", training.requires_grad)
print("eval() alone tracks gradients:", evaluation_with_grad.requires_grad)
print("inference_mode() tracks gradients:", evaluation.requires_grad)
print("correct:", correct, "of", labels.numel())
assert evaluation_with_grad.requires_grad and not evaluation.requires_grad
torch.testing.assert_close(evaluation, evaluation_with_grad)
