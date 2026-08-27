## k8s setup guide:

## Prerequisites
- Docker Desktop installed and running (Linux containers backend)
- `minikube` and `kubectl` installed
- Project repo cloned locally

## 1. Start the cluster
```
minikube start
kubectl config use-context minikube
kubectl get nodes          # confirms cluster is actually reachable
```

## 2. Point your Docker CLI at minikube's internal daemon
This matters if you're building images locally rather than loading them — otherwise your builds land in Docker Desktop's daemon, which minikube never sees.
```
@For /f "tokens=*" %i IN ('minikube docker-env --shell cmd') DO @%i
```
Run this in every new terminal session before building. (Alternative that avoids needing this each time — build normally, then `minikube image load <image>:latest`.)

## 3. Build the images
```
docker build -t code-backend:latest ./backend
docker build --build-arg VITE_API_URL=http://localhost:5010/api -t code-frontend-gcp:latest ./frontend
docker build --build-arg VITE_API_URL=http://localhost:5000/api -t code-frontend-aws:latest ./frontend
docker build -t code-review-service:latest ./review_service
docker build -t code-notification-service:latest ./notification_service
```
(adjust names/paths to match the actual repo's Dockerfile locations)

If you didn't build inside a `docker-env`-configured shell, load each one explicitly:
```
minikube image load code-backend:latest
minikube image load code-frontend-gcp:latest
minikube image load code-frontend-aws:latest
minikube image load code-review-service:latest
minikube image load code-notification-service:latest
```

## 4. Deploy each namespace
Repeat for both `aws-simulation` and `gcp-simulation`:
```
kubectl apply -f k8s/backend/backend-secret.yaml -n <namespace>
kubectl apply -f k8s/backend/mongo.yaml -n <namespace>
kubectl apply -f k8s/backend/postgres.yaml -n <namespace>
kubectl apply -f k8s/backend/backend.yaml -n <namespace>
kubectl apply -f k8s/review_service/review-secret.yaml -n <namespace>
kubectl apply -f k8s/review_service/review-mongo.yaml -n <namespace>
kubectl apply -f k8s/review_service/review-service.yaml -n <namespace>
kubectl apply -f k8s/notification_service/notification-secret.yaml -n <namespace>
kubectl apply -f k8s/notification_service/notification-postgres.yaml -n <namespace>
kubectl apply -f k8s/notification_service/notification-service.yaml -n <namespace>
kubectl apply -f k8s/frontend/frontend.yaml -n <namespace>
```

## 5. Run migrations (backend, per namespace)
```
kubectl exec -it -n <namespace> deployment/backend -- npx prisma migrate deploy
kubectl exec -it -n <namespace> deployment/backend -- npx prisma db seed
```

## 6. Verify pods and services came up
```
kubectl get pods -n <namespace>
kubectl get svc -n <namespace>
```
All pods should show `1/1 Running`. If not, see troubleshooting below.

## 7. Port-forward and smoke test
```
kubectl port-forward -n aws-simulation svc/backend 5000:5000
kubectl port-forward -n aws-simulation svc/review-service 5001:5001
kubectl port-forward -n aws-simulation svc/notification-service 5002:5002
kubectl port-forward -n aws-simulation svc/frontend 3000:80

kubectl port-forward -n gcp-simulation svc/backend 5010:5000
kubectl port-forward -n gcp-simulation svc/review-service 5011:5001
kubectl port-forward -n gcp-simulation svc/notification-service 5022:5002
kubectl port-forward -n gcp-simulation svc/frontend 3010:80
```
Each needs its own terminal (they block). Then:
```
curl http://localhost:5000
curl http://localhost:5001
curl http://localhost:5002
curl http://localhost:3000
```

---

# Common Troubleshooting Commands

**Pod not starting / crashing**
```
kubectl get pods -n <namespace>
kubectl describe pod <pod-name> -n <namespace>
kubectl logs -n <namespace> <pod-name>
kubectl logs -n <namespace> <pod-name> --previous
```

**Force a pod to recreate (e.g. after loading a new image)**
```
kubectl delete pod -n <namespace> -l app=<app-label>
```

**Confirm which image a pod is actually running**
```
kubectl get pod <pod-name> -n <namespace> -o jsonpath="{.spec.containers[*].image}"
```

**Check if minikube even has your latest image**
```
minikube image ls --format table | findstr <image-name>
docker images | findstr <image-name>
```
Compare IDs — mismatch means you built but never loaded it into minikube.

**Switch Docker CLI from Docker Desktop → minikube's daemon**
```
@For /f "tokens=*" %i IN ('minikube docker-env --shell cmd') DO @%i
```
(only works if `minikube status` shows Running first)

**Cluster/API server unreachable**
```
minikube status
minikube start
kubectl config current-context minikube
kubectl config use-context minikube 
```

**Port already in use locally**
```
netstat -ano | findstr :<port>
```

**Check kubeconfig context / server address**
```
kubectl config view --minify
```