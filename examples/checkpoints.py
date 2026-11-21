import io

import torch
from torch import nn

torch.manual_seed(11)
model = nn.Linear(3, 2)
inputs = torch.tensor([[1., -2., 3.]])

# BytesIO also works in the browser's temporary session.
buffer = io.BytesIO()
torch.save(model.state_dict(), buffer)
buffer.seek(0)
restored = nn.Linear(3, 2)
restored.load_state_dict(torch.load(buffer, map_location="cpu", weights_only=True))
restored.eval()

with torch.inference_mode():
    original, reloaded = model(inputs), restored(inputs)
print("serialized bytes:", buffer.getbuffer().nbytes)
print("restored prediction:", reloaded.tolist())
torch.testing.assert_close(original, reloaded)
