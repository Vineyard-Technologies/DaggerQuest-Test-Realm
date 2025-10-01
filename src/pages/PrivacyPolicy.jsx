import React from 'react'
import SEO from '../components/SEO'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

function PrivacyPolicy() {
  const contentRef = useScrollAnimation()

  return (
    <>
      <SEO 
        title="Privacy Policy | DaggerQuest | Browser ARPG"
        description="DaggerQuest Privacy Policy: Learn how we collect, use, and protect your data when you play our browser ARPG."
        url="https://DaggerQuest.com/privacy-policy"
      />
      <main ref={contentRef} className="container legal-page fade-in-element">
        <h1>privacy policy</h1>
        <h2>Introduction</h2>
        <p><a href="https://VineyardTechnologies.org/" className="legal-link">Vineyard Technologies</a> respects your privacy and is committed to protecting your personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you play <a href="https://DaggerQuest.com/" className="legal-link">DaggerQuest</a>.</p>
        
        <h2>Information We Collect</h2>
        <p>We may collect the following types of personal information: Account Information: Username, email address, password. Usage Data: Information about how you use the game, such as game play statistics, preferences, and device information. Payment Information: If you make in-game purchases, we may collect payment information, such as credit card numbers or other payment methods.</p>
        
        <h2>How We Use Your Information</h2>
        <p>We may use your personal information for the following purposes: Providing the Service: To deliver and improve our game service. Account Management: To manage your account, including processing payments and providing customer support. Communication: To send you important notices, updates, and marketing communications. Security: To protect our services and users from fraud and abuse. Legal Compliance: To comply with legal obligations.</p>
        
        <h2>Sharing Your Information</h2>
        <p>We may share your personal information with: Service Providers: Third-party service providers who help us operate our game, such as payment processors and analytics providers. Legal Authorities: If required by law or to protect our rights.</p>
        
        <h2>Data Security</h2>
        <p>We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
        
        <h2>Your Choices</h2>
        <p>You have certain choices regarding your personal information: Account Information: You can access and update your account information. Marketing Communications: You can opt out of marketing emails by following the unsubscribe instructions in the email. Data Retention: We retain your personal information as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by law.</p>
        
        <h2>Changes to this Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time.</p>
      </main>
    </>
  )
}

export default PrivacyPolicy