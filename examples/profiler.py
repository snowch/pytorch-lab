import sys

import torch
from torch import nn

model = nn.Sequential(nn.Linear(16, 32), nn.ReLU(), nn.Linear(32, 4)).eval()
batch = torch.ones(8, 16)
with torch.inference_mode():
    expected = model(batch)
    if sys.platform == "emscripten":
        # The browser build omits the native profiling backend.
        print("Output shape:", tuple(expected.shape))
        print("Download Python and run locally to collect native operator events.")
    else:
        from torch.profiler import ProfilerActivity, profile
        with profile(activities=[ProfilerActivity.CPU], record_shapes=True) as prof:
            output = model(batch)
        torch.testing.assert_close(output, expected)
        assert any(event.key == "aten::linear" for event in prof.key_averages())
        print(prof.key_averages().table(sort_by="self_cpu_time_total", row_limit=8))

assert expected.shape == (8, 4)
