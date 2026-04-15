package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"rgc/go-backend/internal/game"
)

func main() {
	engine := game.NewEngine()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	mux.HandleFunc("/v1/round/state", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(engine.State())
	})

	mux.HandleFunc("/v1/round/tick", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		engine.Advance()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(engine.State())
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           withLogging(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("go backend listening on %s", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(started))
	})
}
