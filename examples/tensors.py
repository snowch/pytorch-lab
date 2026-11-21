import torch

readings = torch.tensor([[12.0, 18.0, 24.0], [15.0, 21.0, 27.0]])
print("shape:", tuple(readings.shape))
print("dtype:", readings.dtype)
print("device:", readings.device)
print("first row:", readings[0].tolist())
print("last column:", readings[:, -1].tolist())
print("means by row:", readings.mean(dim=1).tolist())

assert readings.shape == (2, 3)
torch.testing.assert_close(readings.mean(dim=1), torch.tensor([18., 21.]))
