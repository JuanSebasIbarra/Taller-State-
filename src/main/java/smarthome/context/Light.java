package smarthome.context;

import java.util.UUID;

/**
 * Represents a single smart light accessory in the home.
 */
public class Light {
    private String id;
    private String room;
    private String name;
    private boolean isOn;

    public Light(String room, String name) {
        this.id = UUID.randomUUID().toString();
        this.room = room;
        this.name = name;
        this.isOn = false; // Default state
    }

    public String getId() { return id; }
    public String getRoom() { return room; }
    public String getName() { return name; }
    public boolean isOn() { return isOn; }

    public void setOn(boolean on) { isOn = on; }

    // Manually constructs a JSON representation for this Light
    public String toJson() {
        return String.format(
            "{\"id\":\"%s\", \"room\":\"%s\", \"name\":\"%s\", \"isOn\":%b}",
            id, room, name, isOn
        );
    }
}
