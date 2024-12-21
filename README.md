
# **URL Shortener**

A simple and efficient URL Shortening service built with **NestJS**. This service allows users to shorten long URLs, track clicks, and gather useful insights about user interactions.

---

## **Features**

- **URL Shortening**: Convert long URLs into shorter, shareable links.
- **Analytics**:
  - Track clicks on shortened URLs.
  - Capture metadata like IP address, operating system, and device type.
- **Rate Limiting**: Prevent abuse by limiting the number of requests per user within a specific time window.
- **Active/Inactive URLs**: Enable or disable shortened URLs as needed.

---

## **Tech Stack**

- **Backend**: [NestJS](https://nestjs.com/) (Node.js Framework)
- **Database**: PostgreSQL
- **Cache & Queue**: Redis
- **Containerization**: Docker
- **Testing**: Jest
- **Other Libraries**: `ua-parser-js` for extracting OS and device information.

---

## **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone git@github.com:nitin-kukreti/url-shortener.git
cd url-shortener
```

### **2. Install Dependencies**
Make sure you have Node.js and npm installed, then run:
```bash
npm install
```

### **3. Configure Environment Variables**
Create a `.env` file in the root directory and add the following variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/url_shortener
REDIS_URL=redis://localhost:6379
PORT=3000
JWT_SECRET=your_secret_key
RATE_LIMIT_WINDOW=15 # in minutes
RATE_LIMIT_REQUESTS=100 # max requests per window
```

### **4. Run the Application**
- **Development Mode**:
  ```bash
  npm run start:dev
  ```
- **Production Mode** (with Docker):
  ```bash
  docker-compose up --build
  ```

### **5. Access the Application**
Visit the application at: [http://localhost:3000](http://localhost:3000)

---

## **API Endpoints**

### **1. Shorten URL**
**POST** `/shorten`  
Request Body:
```json
{
  "longUrl": "https://example.com",
  "alias": "custom-alias" // (optional)
}
```
Response:
```json
{
  "shortUrl": "http://localhost:3000/custom-alias"
}
```

### **2. Redirect Shortened URL**
**GET** `/{alias}`  
Redirects to the original URL.

### **3. View Analytics**
**GET** `/analytics/{alias}`  
Response:
```json
{
  "clicks": 100,
  "deviceStats": {
    "desktop": 60,
    "mobile": 40
  },
  "osStats": {
    "Windows": 50,
    "iOS": 30,
    "Android": 20
  }
}
```

---

## **Development**

### **Code Formatting**
Use **Prettier** and **ESLint**:
```bash
npm run lint
npm run format
```

### **Run Tests**
```bash
npm run test
npm run test:e2e
```

---

## **Deployment**

To deploy the application, ensure that the environment variables are correctly configured and use Docker to build and deploy the service.  
```bash
docker-compose -f docker-compose.prod.yml up --build
```

---

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
