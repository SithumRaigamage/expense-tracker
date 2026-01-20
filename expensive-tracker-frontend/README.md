# Expensive Tracker Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Docker

### Building the Docker Image

To build the Docker image, run:

```bash
docker build -t expense-tracker:1.0.3 .
```

### Running the Container

To run the container, use:

```bash
docker run -d -p 4200:80 --name expense-tracker-frontend expense-tracker:1.0.3
```

This will start the application and make it accessible at `http://localhost:4200`.

### Docker Configuration

The Docker setup uses:

- Node.js Alpine for building the Angular application
- Nginx Alpine for serving the compiled application
- Custom Nginx configuration for proper Angular routing

### Security Scanning

We use Trivy for container security scanning:

```bash
trivy image expense-tracker:1.0.3
```

Scan reports are stored in the `docs/trivy-reports/` directory.


