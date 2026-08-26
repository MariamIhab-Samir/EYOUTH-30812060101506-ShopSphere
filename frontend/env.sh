cat <<EOF > /usr/share/nginx/html/config.js
window._env_ ={
 API_URL: "${API_URL}"
};
EOF

exec "$@"