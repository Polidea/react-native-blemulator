<p align="center">
  <img
    alt="react-native-blemulator library logo"
    src="docs/logo.png"
    height="300"
    style="margin-top: 20px; margin-bottom: 20px;"
  />
</p>

# react-native-blemulator

## Getting started

`$ npm install react-native-blemulator --save`

### Mostly automatic installation

`$ react-native link react-native-blemulator`

## Usage

### First, create simulated peripheral

```javascript
import { SimulatedPeripheral, SimulatedService } from "react-native-blemulator";

const simulatedPeripheral = new SimulatedPeripheral({
  name: "My peripheral",
  localName: "My peripheral",
  id: "1234",
  advertisementInterval: 1000,
  isConnectable: true,
  serviceUuids: [],
  rssi: -90,
  services: [
    new SimulatedService({
      // ...
    }),
  ],
});
```

### Second, register this peripheral and enable simulation

```javascript
import { blemulator } from "react-native-blemulator";

blemulator.addPeripheral(simulatedPeripheral);
blemulator.simulate();
```

### Finally, create `BleManager` instance and use it normally

```javascript
import { BleManager } from "react-native-ble-plx";

const manager = new BleManager();
```
