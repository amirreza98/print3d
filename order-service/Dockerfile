# --- build stage -------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Cache dependencies first
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# --- runtime stage -----------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as an unprivileged user
RUN groupadd --system app && useradd --system --gid app app
USER app

COPY --from=build /workspace/target/order-service-*.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
