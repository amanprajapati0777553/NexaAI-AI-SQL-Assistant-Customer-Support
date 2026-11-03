FAQ = [
    ("Shipping", "Standard shipping usually takes 3-5 business days. Delivery may vary by location."),
    ("Returns", "Eligible products can be returned within 30 days of delivery. Products must be unused and in original packaging."),
    ("Refunds", "Refunds are processed after the returned product has been received and inspected."),
    ("Orders", "Orders usually ship within 1-2 business days. Customers should provide an order ID for order-specific help."),
    ("Contact", "Contact human support at support@example.com."),
    ("Account", "Customers can update profile information and password in account settings."),
]

def knowledge_context():
    return "\n\n".join(f"Topic: {topic}\n{content}" for topic, content in FAQ)
