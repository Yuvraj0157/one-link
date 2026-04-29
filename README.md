<p align="center"><img src="https://onelinkprofile.s3.ap-south-1.amazonaws.com/assets/nelink-logo.png" alt="NELINK Logo" width="200px" height="200px"></p>

<h1 align="center">NELINK - All Your Links in One Place</h1>

<p align="center">
  <a href="https://onelink-ej3n.onrender.com/">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#setup">Setup</a> •
  <a href="#contributing">Contributing</a>
</p>

NELINK is a modern, feature-rich link-in-bio platform that helps you centralize all your online presence in one beautiful, customizable page. Perfect for content creators, influencers, businesses, and anyone who wants to share multiple links with their audience.

**Sample Profile:** [Yuvraj Singh](https://onelink-ej3n.onrender.com/profile/yuvraj0157)

---

## ✨ Features

### 🎨 **Customization & Themes**
- **18+ Beautiful Themes**: Choose from a variety of stunning themes including Dark, Purple, Snow, Meteor, Wave, and more
- **Live Preview**: See changes in real-time before publishing
- **Custom Profile**: Add profile picture, title, bio, and social links
- **Theme Preview Modal**: Preview all themes before applying

### 🔗 **Link Management**
- **Unlimited Links**: Add as many links as you need
- **Drag & Drop Reordering**: Easily reorganize your links
- **Bulk Actions**: Enable/disable or delete multiple links at once
- **Link Previews**: Automatic favicon fetching for better visual appeal
- **Smart Empty States**: Helpful guidance when you're just getting started

### 📊 **Advanced Analytics**
- **Real-time Click Tracking**: Monitor every click on your links
- **Device Detection**: See if visitors use Mobile, Desktop, or Tablet
- **Geographic Insights**: Track visitor countries with flag indicators
- **Referrer Tracking**: Know where your traffic comes from (Social media, Direct, etc.)
- **Performance Metrics**: 
  - Click-Through Rate (CTR) calculations
  - Performance badges (Excellent/Popular/Growing/Good/New)
  - Average clicks per day
  - Peak activity hours
  - Most active days
- **Visual Charts**: 30-day trend visualization with Chart.js
- **Date Range Picker**: Filter analytics by custom date ranges
- **CSV Export**: Download your analytics data
- **90-Day Data Retention**: Automatic cleanup of old data

### 🏆 **Gamification**
- **Achievement System**: Unlock badges for milestones
  - First Link, 10 Links, 50 Links, 100 Links
  - 100 Clicks, 1K Clicks, 10K Clicks, 100K Clicks
  - Profile Customizer, Theme Explorer, Social Butterfly
  - Week Streak, Month Streak, Year Streak
- **Profile Badge Generator**: Create custom badges for your profile
- **Quick Stats Dashboard**: See your progress at a glance

### 🔒 **Security & Reliability**
- **Enterprise-Level Security**: 
  - Helmet.js for HTTP header protection
  - Rate limiting to prevent abuse
  - NoSQL injection prevention
  - CSRF protection on all forms
- **Secure Authentication**: Token-based login with JWT
- **Email Verification**: Confirm your email address
- **Password Reset**: Easy and secure password recovery
- **Error Handling**: Graceful error pages (403, 404, 500)
- **Request Logging**: Comprehensive logging for debugging

### 🎯 **User Experience**
- **Responsive Design**: Works perfectly on all devices
- **Skeleton Loading**: Smooth loading states
- **Offline Indicator**: Know when you're offline
- **Profile Sharing**: Easy share buttons for social media
- **Modern Notifications**: Beautiful toast notifications
- **Professional Email Templates**: Branded emails for verification and password reset

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, JavaScript, EJS
- **Storage**: AWS S3 for image hosting
- **Charts**: Chart.js for analytics visualization
- **UI Framework**: Bootstrap 5
- **Geolocation**: GeoIP-lite for country detection
- **Security**: Helmet.js, express-rate-limit, express-validator

---

## 🚀 Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yuvraj0157/one-link.git
   cd one-link
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_LOGIN_SECRET=your_jwt_secret
   JWT_RESET_PASSWORD=your_reset_password_secret
   JWT_VERIFICATION_SECRET=your_verification_secret
   SESSION_SECRET=your_session_secret
   EMAIL=your_email@gmail.com
   PASSWORD=your_email_app_password
   S3_ACCESS_KEY=your_aws_access_key
   S3_SECRET_ACCESS_KEY=your_aws_secret_key
   S3_BUCKET_NAME=your_bucket_name
   S3_BUCKET_REGION=your_bucket_region
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "add amazing feature"
   ```
4. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## 🌟 Show Your Support

If you find NELINK helpful, please give it a ⭐️ on GitHub!

---

<p align="center">Made with ❤️ by <a href="https://github.com/Yuvraj0157">Yuvraj Singh</a></p>
