from statistics import median
from time import perf_counter

import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
torch.manual_seed(13)
x = torch.randn(64, 64, device=device)
y = torch.randn(64, 64, device=device)


def elapsed(operation, repeats=10):
    if device.type == "cuda":
        torch.cuda.synchronize()
    start = perf_counter()
    for _ in range(repeats):
        operation()
    if device.type == "cuda":
        torch.cuda.synchronize()
    return (perf_counter() - start) * 1e3 / repeats


def matmul():
    return x @ y


def einsum():
    return torch.einsum("ik,kj->ij", x, y)


torch.testing.assert_close(matmul(), einsum())
print("device:", device, "| dimensions:", tuple(x.shape))
for operation in (matmul, einsum):
    elapsed(operation, repeats=3)
    samples = [elapsed(operation) for _ in range(5)]
    print(operation.__name__, "median ms:", round(median(samples), 4))
