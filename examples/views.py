import torch

x = torch.arange(6).reshape(2, 3)
view = x[:, 1:]
copy = view.clone()
view[0, 0] = -9
transposed = x.T

print("base after editing the view:", x.tolist())
print("clone before the edit:", copy.tolist())
print("transposed shape and strides:", tuple(transposed.shape), transposed.stride())
print("contiguous?", transposed.is_contiguous())
print("flatten in logical order:", transposed.reshape(-1).tolist())

assert x[0, 1].item() == -9
assert copy[0, 0].item() == 1
assert transposed.stride() == (1, 3)
