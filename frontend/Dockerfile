FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY env.sh /env.sh
RUN sed -i 's/\r$//' /env.sh && chmod +x /env.sh
EXPOSE 80
ENTRYPOINT ["/env.sh"]
CMD ["nginx", "-g", "daemon off;"]