package smarthome.context;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller class to manage all accessories (Lights, Washing Machines, Doors, etc.).
 * Renamed to AccessoryController conceptually but kept as LightController for compatibility.
 */
public class LightController {
    private List<Accessory> accessories;

    public LightController() {
        this.accessories = new ArrayList<>();
        
        // Initialize with default accessories to match the Apple Home feel
        addAccessory("Light", "Living Room", "Main Chandelier");
        addAccessory("Light", "Kitchen", "Ceiling Lights");
        addAccessory("WashingMachine", "Laundry Room", "Washer");
        addAccessory("Kitchen", "Kitchen", "Oven");
        addAccessory("Door", "Front", "Main Door");
    }

    // Add a new accessory
    public Accessory addAccessory(String type, String room, String name) {
        Accessory newAcc = new Accessory(type, room, name);
        accessories.add(newAcc);
        return newAcc;
    }

    // Remove an accessory by ID
    public boolean removeAccessory(String id) {
        return accessories.removeIf(acc -> acc.getId().equals(id));
    }

    // Toggle a specific accessory by ID
    public boolean toggleAccessory(String id, boolean state) {
        for (Accessory acc : accessories) {
            if (acc.getId().equals(id)) {
                acc.setOn(state);
                return true;
            }
        }
        return false;
    }

    // Toggle all accessories of a specific type (e.g. all Lights)
    public void setAllOfType(String type, boolean state) {
        for (Accessory acc : accessories) {
            if (acc.getType().equalsIgnoreCase(type)) {
                acc.setOn(state);
            }
        }
    }

    // Turn all lights in a specific room ON or OFF
    public void setRoomLights(String room, boolean state) {
        for (Accessory acc : accessories) {
            if (acc.getRoom().equalsIgnoreCase(room) && acc.getType().equalsIgnoreCase("Light")) {
                acc.setOn(state);
            }
        }
    }

    // Turn ALL accessories ON or OFF (Careful with Doors!)
    public void setAllLights(boolean state) {
        setAllOfType("Light", state);
    }

    // Lock/Unlock specific doors
    public void setDoorState(boolean locked) {
        setAllOfType("Door", locked);
    }

    // Get all accessories grouped by room, formatting as a JSON array manually
    public String getAllAccessoriesAsJson() {
        String json = accessories.stream()
            .map(Accessory::toJson)
            .collect(Collectors.joining(",\n    "));
            
        return "[\n    " + json + "\n]";
    }
}
