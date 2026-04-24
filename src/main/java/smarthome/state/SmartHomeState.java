package smarthome.state;

import smarthome.context.SmartHome;

/**
 * Interface that represents the State in the State Pattern.
 * Defines all possible transitions and behaviors.
 */
public interface SmartHomeState {
    void setHomeMode(SmartHome context);
    void setAwayMode(SmartHome context);
    void setNightMode(SmartHome context);
    void setVacationMode(SmartHome context);
    
    // Returns the detailed status of the system based on the current state
    String getStatus();
}
