package smarthome.context;

import smarthome.state.SmartHomeState;
import smarthome.state.HomeState;

/**
 * The Context class that maintains a reference to the current state.
 * Also holds the controllers for accessories like Lights.
 */
public class SmartHome {
    private SmartHomeState currentState;
    private LightController lightController;

    public SmartHome() {
        // Initial state is HomeState
        this.currentState = new HomeState();
        
        // Initialize the light controller
        this.lightController = new LightController();
    }

    public void setState(SmartHomeState state) {
        this.currentState = state;
    }

    public void setHomeMode() {
        currentState.setHomeMode(this);
    }

    public void setAwayMode() {
        currentState.setAwayMode(this);
    }

    public void setNightMode() {
        currentState.setNightMode(this);
    }

    public void setVacationMode() {
        currentState.setVacationMode(this);
    }

    public String getStatus() {
        return currentState.getStatus();
    }
    
    public String getStateName() {
        return currentState.getClass().getSimpleName();
    }

    // Access to the light controller for the HTTP Server
    public LightController getLightController() {
        return lightController;
    }
}
