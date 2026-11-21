import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
host = torch.tensor([[1., 2.], [3., 4.]])
x = host.to(device)
actual = (x @ x.T).cpu()
expected = torch.tensor([[5., 11.], [11., 25.]])

print("execution device:", x.device)
print("result device after .cpu():", actual.device)
print("values:", actual.tolist())
torch.testing.assert_close(actual, expected)
