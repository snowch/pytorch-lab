import torch

x = torch.tensor([[1., 2., 3.], [0., 4., 1.]])
w = torch.tensor([[2., 1.], [-1., 0.], [1., 2.]])
bias = torch.tensor([0.5, -1.0])
scores = x @ w + bias
print("scores:", scores.tolist())
print("one score by hand:", (x[0] * w[:, 0]).sum().item() + bias[0].item())
print("class per row:", scores.argmax(dim=1).tolist())

torch.testing.assert_close(scores, torch.tensor([[3.5, 6.], [-2.5, 1.]]))
