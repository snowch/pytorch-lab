import torch

x = torch.tensor([1., 2., -3.], requires_grad=True)
loss = (3 * x + 1).square().sum()
loss.backward()
first = x.grad.clone()
loss_again = (3 * x + 1).square().sum()
loss_again.backward()

print("loss:", loss.item())
print("first backward:", first.tolist())
print("after two backwards:", x.grad.tolist())
torch.testing.assert_close(first, 6 * (3 * x.detach() + 1))
torch.testing.assert_close(x.grad, 2 * first)
