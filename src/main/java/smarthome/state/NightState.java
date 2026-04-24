package smarthome.state;

import smarthome.context.SmartHome;

public class NightState implements SmartHomeState {
    @Override
    public void setHomeMode(SmartHome context) {
        System.out.println("Switching to Home mode...");
        context.setState(new HomeState());
    }

    @Override
    public void setAwayMode(SmartHome context) {
        System.out.println("Switching to Away mode...");
        context.setState(new AwayState());
    }

    @Override
    public void setNightMode(SmartHome context) {
        System.out.println("Already in Night mode.");
    }

    @Override
    public void setVacationMode(SmartHome context) {
        System.out.println("Switching to Vacation mode...");
        context.setState(new VacationState());
    }

    @Override
    public String getStatus() {
        return "Night Mode: Dim lights, temperature is set to 20°C, doors are locked, exterior cameras activated.";
    }
}
