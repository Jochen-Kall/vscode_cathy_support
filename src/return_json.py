import json

import sys

Data_in=json.loads(sys.argv[1])

x = Data_in["x"]

Data_out={"x":x,
          "y":x*x,
          "Message": "du stinkst!"}

Data_s=json.dumps(Data_out)
print(Data_s)


