#!/bin/bash

# Mobile Shop ERP - Deployment Script
# Usage: ./deploy.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           Mobile Shop ERP - Deployment Manager             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup       - Initial setup (copy env, install deps)"
    echo "  dev         - Start development environment"
    echo "  prod        - Start production environment"
    echo "  stop        - Stop all containers"
    echo "  restart     - Restart all containers"
    echo "  logs        - View container logs"
    echo "  status      - Show container status"
    echo "  build       - Build Docker images"
    echo "  migrate     - Run database migrations"
    echo "  seed        - Seed database with initial data"
    echo "  backup      - Backup MongoDB database"
    echo "  restore     - Restore MongoDB database"
    echo "  clean       - Remove all containers and volumes"
    echo "  help        - Show this help message"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
}

setup() {
    echo -e "${YELLOW}Setting up Mobile Shop ERP...${NC}"

    # Copy .env file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example "$ENV_FILE"
            echo -e "${GREEN}Created .env file from .env.example${NC}"
            echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
        else
            echo -e "${RED}Error: .env.example not found${NC}"
            exit 1
        fi
    fi

    # Install server dependencies
    echo -e "${YELLOW}Installing server dependencies...${NC}"
    cd server && npm install && cd ..

    # Install client dependencies
    echo -e "${YELLOW}Installing client dependencies...${NC}"
    cd client && npm install && cd ..

    echo -e "${GREEN}Setup completed successfully!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Edit .env file with your configuration"
    echo "2. Run: $0 dev (for development)"
    echo "   or: $0 prod (for production)"
}

start_dev() {
    echo -e "${YELLOW}Starting development environment...${NC}"
    docker-compose -f $COMPOSE_FILE up -d mongodb
    echo -e "${GREEN}MongoDB started${NC}"
    echo -e "${YELLOW}Starting server and client...${NC}"
    cd server && npm run dev &
    cd client && npm run dev &
    echo -e "${GREEN}Development environment started${NC}"
    echo -e "${BLUE}Server: http://localhost:5000${NC}"
    echo -e "${BLUE}Client: http://localhost:3000${NC}"
    echo -e "${BLUE}MongoDB: localhost:27017${NC}"
}

start_prod() {
    echo -e "${YELLOW}Starting production environment...${NC}"
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}Error: .env file not found${NC}"
        echo -e "${YELLOW}Run: $0 setup${NC}"
        exit 1
    fi

    docker-compose -f $COMPOSE_FILE --profile production up -d --build
    echo -e "${GREEN}Production environment started${NC}"
    echo -e "${BLUE}Application: http://localhost:${HTTP_PORT:-80}${NC}"
}

stop() {
    echo -e "${YELLOW}Stopping all containers...${NC}"
    docker-compose -f $COMPOSE_FILE down
    echo -e "${GREEN}All containers stopped${NC}"
}

restart() {
    echo -e "${YELLOW}Restarting all containers...${NC}"
    docker-compose -f $COMPOSE_FILE restart
    echo -e "${GREEN}All containers restarted${NC}"
}

logs() {
    docker-compose -f $COMPOSE_FILE logs -f
}

status() {
    echo -e "${YELLOW}Container Status:${NC}"
    docker-compose -f $COMPOSE_FILE ps
}

build() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo -e "${GREEN}Build completed${NC}"
}

migrate() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    cd server && npm run migrate && cd ..
    echo -e "${GREEN}Migrations completed${NC}"
}

seed() {
    echo -e "${YELLOW}Seeding database...${NC}"
    cd server && npm run seed && cd ..
    echo -e "${GREEN}Database seeded${NC}"
}

backup() {
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.gz"

    echo -e "${YELLOW}Creating database backup...${NC}"
    docker exec erp-mongodb mongodump --archive --gzip > $BACKUP_FILE
    echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"
}

restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Please specify backup file${NC}"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi

    if [ ! -f "$1" ]; then
        echo -e "${RED}Error: Backup file not found: $1${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Restoring database from: $1${NC}"
    docker exec -i erp-mongodb mongorestore --archive --gzip < $1
    echo -e "${GREEN}Database restored successfully${NC}"
}

clean() {
    echo -e "${RED}WARNING: This will remove all containers, volumes, and data!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        echo -e "${GREEN}All containers and volumes removed${NC}"
    else
        echo -e "${YELLOW}Operation cancelled${NC}"
    fi
}

# Main script
print_header
check_docker

case "${1:-help}" in
    setup)
        setup
        ;;
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    build)
        build
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    clean)
        clean
        ;;
    help|*)
        print_usage
        ;;
esac
