package smarthome;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import smarthome.context.SmartHome;
import smarthome.context.LightController;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

public class Main {
    private static SmartHome smartHome = new SmartHome();

    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/", new StaticFileHandler());

        server.createContext("/api/state", new StateHandler());
        server.createContext("/api/setHome", exchange -> handleStateChange(exchange, () -> {
            smartHome.setHomeMode();
            smartHome.getLightController().setAllLights(true); // Turn all on in home mode
            smartHome.getLightController().setDoorState(false); // unlock doors
        }));
        server.createContext("/api/setAway", exchange -> handleStateChange(exchange, () -> {
            smartHome.setAwayMode();
            smartHome.getLightController().setAllOfType("Light", false); 
            smartHome.getLightController().setAllOfType("Kitchen", false); 
            smartHome.getLightController().setAllOfType("WashingMachine", false); 
            smartHome.getLightController().setDoorState(true); // lock doors
        }));
        server.createContext("/api/setNight", exchange -> handleStateChange(exchange, () -> {
            smartHome.setNightMode();
            smartHome.getLightController().setAllOfType("Light", false); 
            smartHome.getLightController().setAllOfType("Kitchen", false); 
            smartHome.getLightController().setRoomLights("Bedroom", true); // Leave bedroom light
            smartHome.getLightController().setRoomLights("Outside", true); // Outside lights on
            smartHome.getLightController().setDoorState(true); // lock doors
        }));
        server.createContext("/api/setVacation", exchange -> handleStateChange(exchange, () -> {
            smartHome.setVacationMode();
            smartHome.getLightController().setAllOfType("Light", false);
            smartHome.getLightController().setRoomLights("Living Room", true); // Simulate presence
            smartHome.getLightController().setAllOfType("Kitchen", false); 
            smartHome.getLightController().setAllOfType("WashingMachine", false); 
            smartHome.getLightController().setDoorState(true); // lock doors
        }));

        // Accessory API Endpoints
        server.createContext("/api/accessories", new AccessoriesHandler(smartHome.getLightController()));
        server.createContext("/api/accessories/toggle", new AccessoryToggleHandler(smartHome.getLightController()));

        server.setExecutor(null); // creates a default executor
        System.out.println("Starting Smart Home Dashboard...");
        System.out.println("Server running on: http://localhost:" + port);
        server.start();
    }


    private static void handleStateChange(HttpExchange exchange, Runnable stateChanger) throws IOException {
        if ("POST".equals(exchange.getRequestMethod())) {
            stateChanger.run();
            sendStateResponse(exchange);
        } else {
            exchange.sendResponseHeaders(405, -1); // Method Not Allowed
        }
    }


    static class StateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("GET".equals(exchange.getRequestMethod())) {
                sendStateResponse(exchange);
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }
    
    // Handles CRUD for accessories
    static class AccessoriesHandler implements HttpHandler {
        private LightController controller;

        public AccessoriesHandler(LightController controller) {
            this.controller = controller;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("GET".equals(exchange.getRequestMethod())) {
                String response = controller.getAllAccessoriesAsJson();
                sendJsonResponse(exchange, response);
            } else if ("POST".equals(exchange.getRequestMethod())) {
                // Add an accessory
                String body = getRequestBody(exchange);
                String type = extractJsonValue(body, "type");
                String room = extractJsonValue(body, "room");
                String name = extractJsonValue(body, "name");
                
                if (type != null && room != null && name != null) {
                    controller.addAccessory(type, room, name);
                    sendJsonResponse(exchange, "{\"status\": \"success\"}");
                } else {
                    exchange.sendResponseHeaders(400, -1); // Bad Request
                }
            } else if ("DELETE".equals(exchange.getRequestMethod())) {
                // Remove an accessory
                String body = getRequestBody(exchange);
                String id = extractJsonValue(body, "id");
                
                if (id != null && controller.removeAccessory(id)) {
                    sendJsonResponse(exchange, "{\"status\": \"success\"}");
                } else {
                    exchange.sendResponseHeaders(404, -1); // Not Found
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // Handles toggling a single accessory
    static class AccessoryToggleHandler implements HttpHandler {
        private LightController controller;

        public AccessoryToggleHandler(LightController controller) {
            this.controller = controller;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equals(exchange.getRequestMethod())) {
                String body = getRequestBody(exchange);
                String id = extractJsonValue(body, "id");
                String stateStr = extractJsonValue(body, "state");
                
                if (id != null && stateStr != null) {
                    boolean state = Boolean.parseBoolean(stateStr);
                    if (controller.toggleAccessory(id, state)) {
                        sendJsonResponse(exchange, "{\"status\": \"success\"}");
                        return;
                    }
                }
                exchange.sendResponseHeaders(400, -1);
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }


    private static void sendStateResponse(HttpExchange exchange) throws IOException {
        String response = String.format("{\"state\": \"%s\", \"status\": \"%s\"}", 
            smartHome.getStateName(), 
            smartHome.getStatus());
        sendJsonResponse(exchange, response);
    }
    
    private static void sendJsonResponse(HttpExchange exchange, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String getRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        Scanner scanner = new Scanner(is, StandardCharsets.UTF_8.name()).useDelimiter("\\A");
        return scanner.hasNext() ? scanner.next() : "";
    }

    // Extremely simple JSON extractor since we aren't using Jackson/Gson
    private static String extractJsonValue(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start != -1) {
            start += pattern.length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        }
        
        // Check for non-string values (like booleans)
        pattern = "\"" + key + "\":";
        start = json.indexOf(pattern);
        if (start != -1) {
            start += pattern.length();
            int end = json.indexOf(",", start);
            if (end == -1) end = json.indexOf("}", start);
            return json.substring(start, end).trim();
        }
        return null;
    }


    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }
            
            try {
                byte[] fileBytes = Files.readAllBytes(Paths.get("src/main/resources/public" + path));
                
                if (path.endsWith(".html")) {
                    exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
                } else if (path.endsWith(".css")) {
                    exchange.getResponseHeaders().set("Content-Type", "text/css; charset=UTF-8");
                } else if (path.endsWith(".js")) {
                    exchange.getResponseHeaders().set("Content-Type", "application/javascript; charset=UTF-8");
                }
                
                exchange.sendResponseHeaders(200, fileBytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(fileBytes);
                os.close();
            } catch (IOException e) {
                String response = "404 (Not Found)\n";
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }
    }
}