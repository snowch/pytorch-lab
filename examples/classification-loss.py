import torch
from torch import nn

logits = torch.tensor([[3., 0., -2.], [-1., 1., 2.]], requires_grad=True)
labels = torch.tensor([0, 1])
loss = nn.CrossEntropyLoss()(logits, labels)
manual = -logits.log_softmax(dim=1)[torch.arange(2), labels].mean()
loss.backward()

print("probabilities:", logits.detach().softmax(dim=1).tolist())
print("predicted classes:", logits.argmax(dim=1).tolist())
print("cross-entropy:", loss.item())
print("logit gradients:", logits.grad.tolist())

torch.testing.assert_close(loss, manual)
torch.testing.assert_close(logits.grad.sum(dim=1), torch.zeros(2))
