package smarthome.context;

import java.util.UUID;

/**
 * Represents a single smart accessory in the home.
 * Can be a Light, Washing Machine, Kitchen Appliance, or Door.
 */
public class Accessory {
    private String id;
    private String type; // e.g., "Light", "WashingMachine", "Kitchen", "Door"
    private String room;
    private String name;
    private boolean isOn;

    public Accessory(String type, String room, String name) {
        this.id = UUID.randomUUID().toString();
        this.type = type;
        this.room = room;
        this.name = name;
        this.isOn = false; // Default state
    }

    public String getId() { return id; }
    public String getType() { return type; }
    public String getRoom() { return room; }
    public String getName() { return name; }
    public boolean isOn() { return isOn; }

    public void setOn(boolean on) { isOn = on; }

    // Manually constructs a JSON representation for this Accessory
    public String toJson() {
        return String.format(
            "{\"id\":\"%s\", \"type\":\"%s\", \"room\":\"%s\", \"name\":\"%s\", \"isOn\":%b}",
            id, type, room, name, isOn
        );
    }
}
