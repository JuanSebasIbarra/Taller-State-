package smarthome.context;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller class to manage all lights in the smart home.
 * Supports adding, removing, and toggling lights by room.
 */
public class LightController {
    private List<Light> lights;

    public LightController() {
        this.lights = new ArrayList<>();
        
        // Initialize with default lights to match the Apple Home feel
        addLight("Living Room", "Main Chandelier");
        addLight("Living Room", "TV Backlight");
        addLight("Kitchen", "Ceiling Lights");
        addLight("Kitchen", "Island Pendant");
        addLight("Bedroom", "Bedside Lamp");
        addLight("Bathroom", "Mirror Light");
        addLight("Outside", "Porch Light");
    }

    // Add a new light
    public Light addLight(String room, String name) {
        Light newLight = new Light(room, name);
        lights.add(newLight);
        return newLight;
    }

    // Remove a light by ID
    public boolean removeLight(String id) {
        return lights.removeIf(light -> light.getId().equals(id));
    }

    // Toggle a specific light by ID
    public boolean toggleLight(String id, boolean state) {
        for (Light light : lights) {
            if (light.getId().equals(id)) {
                light.setOn(state);
                return true;
            }
        }
        return false;
    }

    // Turn all lights in a specific room ON or OFF
    public void setRoomLights(String room, boolean state) {
        for (Light light : lights) {
            if (light.getRoom().equalsIgnoreCase(room)) {
                light.setOn(state);
            }
        }
    }

    // Turn ALL lights ON or OFF (Useful for state transitions like Night Mode or Away)
    public void setAllLights(boolean state) {
        for (Light light : lights) {
            light.setOn(state);
        }
    }

    // Get all lights grouped by room, formatting as a JSON array manually
    public String getAllLightsAsJson() {
        String lightsJson = lights.stream()
            .map(Light::toJson)
            .collect(Collectors.joining(",\n    "));
            
        return "[\n    " + lightsJson + "\n]";
    }
}
