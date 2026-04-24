package smarthome.state;

import smarthome.context.SmartHome;

public class VacationState implements SmartHomeState {
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
        System.out.println("Switching to Night mode...");
        context.setState(new NightState());
    }

    @Override
    public void setVacationMode(SmartHome context) {
        System.out.println("Already in Vacation mode.");
    }

    @Override
    public String getStatus() {
        return "Vacation Mode: Lights simulate presence randomly, temperature is set to 15°C, full security system active.";
    }
}
