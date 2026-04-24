package smarthome.state;

import smarthome.context.SmartHome;

public class AwayState implements SmartHomeState {
    @Override
    public void setHomeMode(SmartHome context) {
        System.out.println("Switching to Home mode...");
        context.setState(new HomeState());
    }

    @Override
    public void setAwayMode(SmartHome context) {
        System.out.println("Already in Away mode.");
    }

    @Override
    public void setNightMode(SmartHome context) {
        System.out.println("Switching to Night mode...");
        context.setState(new NightState());
    }

    @Override
    public void setVacationMode(SmartHome context) {
        System.out.println("Switching to Vacation mode...");
        context.setState(new VacationState());
    }

    @Override
    public String getStatus() {
        return "Away Mode: Lights are off, temperature is set to 18°C, doors are locked, security system activated.";
    }
}
