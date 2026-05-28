# ─── Stage 1: Build Angular ──────────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /panaderia-front
COPY panaderia-front/package*.json ./
RUN npm install
COPY panaderia-front/ ./
RUN npm run build -- --configuration production

# ─── Stage 2: Build Spring Boot (con Angular embebido) ───────────────
FROM eclipse-temurin:17-jdk-alpine AS backend

WORKDIR /app
COPY panaderia-api/ ./panaderia-api/
# El pom.xml copia desde ../panaderia-front/dist/panaderia-front/browser
COPY --from=frontend /panaderia-front/dist/panaderia-front/browser \
     ./panaderia-front/dist/panaderia-front/browser

WORKDIR /app/panaderia-api
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# ─── Stage 3: Imagen final de ejecución ──────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=backend /app/panaderia-api/target/panaderia-api-1.0.0.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
