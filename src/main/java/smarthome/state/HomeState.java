package smarthome.state;

import smarthome.context.SmartHome;

public class HomeState implements SmartHomeState {
    @Override
    public void setHomeMode(SmartHome context) {
        System.out.println("Already in Home mode.");
    }

    @Override
    public void setAwayMode(SmartHome context) {
        System.out.println("Switching to Away mode...");
        context.setState(new AwayState());
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
        return "Home Mode: Lights are on, temperature is set to 22°C, doors are unlocked.";
    }
}
