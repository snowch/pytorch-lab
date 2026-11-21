import torch


def loss(p):
    return (p.square() - 3).square()


p = torch.tensor(1.2, dtype=torch.float64, requires_grad=True)
exact, = torch.autograd.grad(loss(p), p)
epsilon = 1e-5
with torch.no_grad():
    finite_difference = (loss(p + epsilon) - loss(p - epsilon)) / (2 * epsilon)

print("autograd:", exact.item())
print("finite difference:", finite_difference.item())
print("absolute error:", (exact - finite_difference).abs().item())
torch.testing.assert_close(exact, finite_difference, rtol=1e-7, atol=1e-7)
