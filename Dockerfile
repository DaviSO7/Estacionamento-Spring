FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline
COPY src/ src/
RUN ./mvnw -B package

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN mkdir -p /app/database && chown -R 10001:10001 /app
COPY --from=build --chown=10001:10001 /app/target/estacionamento-0.0.1-SNAPSHOT.jar /app/app.jar
USER 10001:10001
ENV SPRING_PROFILES_ACTIVE=render
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0"
EXPOSE 10000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
