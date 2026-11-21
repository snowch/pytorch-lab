import torch

values = torch.tensor([[3., 11., 120.], [5., 15., 140.]])
offset = torch.tensor([1., 5., 100.])
scale = torch.tensor([2., 2., 10.])
adjusted = (values - offset) / scale
row_weights = torch.tensor([1., 2.])[:, None]
weighted = adjusted * row_weights
print("adjusted:", adjusted.tolist())
print("weight shape:", tuple(row_weights.shape))
print("row sums:", weighted.sum(dim=1).tolist())

torch.testing.assert_close(weighted, torch.tensor([[1., 3., 2.], [4., 10., 8.]]))
