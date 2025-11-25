
import streamlit as st # type: ignore
import pandas as pd # pyright: ignore[reportMissingModuleSource]
import datetime
import uuid
import json
from pathlib import Path

DATA_DIR = Path("/mnt/data/foodonbus_passenger")
DATA_DIR.mkdir(parents=True, exist_ok=True)
ORDERS_FILE = DATA_DIR / "orders.json"
SAMPLE_MENU = [
    {"id":"m1","name":"Veg Biryani","price":120, "eta_mins":15},
    {"id":"m2","name":"Chicken Biryani","price":160, "eta_mins":18},
    {"id":"m3","name":"Paneer Butter Masala + Roti","price":140, "eta_mins":12},
    {"id":"m4","name":"Masala Dosa","price":70, "eta_mins":10},
    {"id":"m5","name":"Samosa (2 pcs)","price":40, "eta_mins":8},
    {"id":"m6","name":"Cold Drink 500ml","price":40, "eta_mins":5},
]

# Utility functions
def load_orders():
    if ORDERS_FILE.exists():
        try:
            return json.loads(ORDERS_FILE.read_text())
        except Exception:
            return []
    return []

def save_order(order):
    orders = load_orders()
    orders.append(order)
    ORDERS_FILE.write_text(json.dumps(orders, indent=2))

def format_currency(x):
    return f"₹{x:.2f}"

def generate_order_id():
    return str(uuid.uuid4())[:8]

# Sample trip and seat auto-fill (simulate)
SAMPLE_TRIPS = [
    {"bus_no":"TN01AB1234", "route":"Chennai → Bangalore", "boarding_point":"Chennai Airport", "seat":"12A", "departure":"2025-11-26 22:00"},
    {"bus_no":"KA05CD5678", "route":"Bangalore → Mysore", "boarding_point":"Majestic Bus Stop", "seat":"7B", "departure":"2025-11-27 06:30"},
    {"bus_no":"AP09EF9012", "route":"Vijayawada → Hyderabad", "boarding_point":"Main Bus Stand", "seat":"3C", "departure":"2025-11-27 14:15"},
]

def choose_trip_ui():
    st.sidebar.header("Trip / Booking")
    st.sidebar.write("If you booked your ticket online, select it here to auto-fill details.")
    trip_choice = st.sidebar.selectbox("Select a saved booking (simulated)", options=["-- none --"] + [f\"{t['bus_no']} | {t['route']} | Seat {t['seat']}\" for t in SAMPLE_TRIPS])
    if trip_choice != "-- none --":
        idx = [f\"{t['bus_no']} | {t['route']} | Seat {t['seat']}\" for t in SAMPLE_TRIPS].index(trip_choice)
        return SAMPLE_TRIPS[idx]
    return None

def app_header():
    st.markdown("""
    <style>
    .app-header {background: linear-gradient(90deg,#0f172a,#0b1220); padding: 18px; border-radius: 12px; color: white}
    .muted {color: #b6c2d9}
    </style>
    """, unsafe_allow_html=True)
    st.markdown('<div class="app-header"><h2>Food On Bus — Passenger App</h2><div class="muted">Order meals to your seat on-the-go · Eat Now / Eat Later · Schedule at stops</div></div>', unsafe_allow_html=True)
    st.write("")

def menu_ui():
    st.subheader("Menu")
    df = pd.DataFrame(SAMPLE_MENU)
    df_display = df[["name","price","eta_mins"]].copy()
    df_display["price"] = df_display["price"].apply(format_currency)
    df_display = df_display.rename(columns={"name":"Item","price":"Price","eta_mins":"Est. prep (mins)"})
    st.table(df_display)

def order_builder_ui(auto_trip):
    st.subheader("Build your order")
    cols = st.columns([3,1,1])
    with cols[0]:
        item = st.selectbox("Select item", options=[f\"{m['name']} — {format_currency(m['price'])}\" for m in SAMPLE_MENU])
    with cols[1]:
        qty = st.number_input("Qty", min_value=1, max_value=10, value=1, step=1)
    with cols[2]:
        add = st.button("Add to cart")
    cart = st.session_state.get("cart", [])
    if "cart" not in st.session_state:
        st.session_state["cart"] = []
        cart = st.session_state["cart"]
    if add:
        sel = [m for m in SAMPLE_MENU if m["name"] in item][0]
        cart_item = {"id": sel["id"], "name": sel["name"], "price": sel["price"], "qty": qty}
        st.session_state["cart"].append(cart_item)
        st.success(f\"Added {qty} x {sel['name']} to cart\")

    st.write("---")
    st.write("### Cart")
    if st.session_state.get("cart"):
        dfc = pd.DataFrame(st.session_state["cart"])
        dfc["total"] = dfc["price"] * dfc["qty"]
        dfc_display = dfc[["name","qty","price","total"]].copy()
        dfc_display["price"] = dfc_display["price"].apply(format_currency)
        dfc_display["total"] = dfc_display["total"].apply(format_currency)
        dfc_display = dfc_display.rename(columns={"name":"Item","qty":"Qty","price":"Unit","total":"Total"})
        st.table(dfc_display)
        st.write("**Order subtotal:**", format_currency(dfc["total"].sum()))
        if st.button("Clear cart"):
            st.session_state["cart"] = []
            st.experimental_rerun()
    else:
        st.info("Your cart is empty. Add items above.")

    st.write("---")
    st.subheader("Delivery options")
    mode = st.radio("Choose mode", options=["Eat Now (deliver at next stop)","Eat Later (schedule at a later stop)","Eat Tomorrow"])
    scheduled = {}
    if mode == "Eat Later (schedule at a later stop)":
        stops = ["Stop 1 - Highway Junction", "Stop 2 - Petrol Pump", "Stop 3 - Bus Stand", "Stop 4 - City Outskirts"]
        stop = st.selectbox("Schedule delivery at", options=stops)
        time_at_stop = st.time_input("Approx time at that stop", value=datetime.time(hour=23, minute=0))
        scheduled = {"stop": stop, "time": str(time_at_stop)}
    if mode == "Eat Tomorrow":
        date = st.date_input("Delivery date", value=datetime.date.today() + datetime.timedelta(days=1))
        stop = st.text_input("Drop point (e.g., next station or hotel)")
        scheduled = {"date": str(date), "stop": stop}

    st.write("---")
    st.subheader("Passenger details")
    if auto_trip:
        st.info("Auto-filled from your booking.")
        col1, col2 = st.columns(2)
        with col1:
            bus_no = st.text_input("Bus number", value=auto_trip["bus_no"])
            seat = st.text_input("Seat number", value=auto_trip["seat"])
        with col2:
            route = st.text_input("Route", value=auto_trip["route"])
            boarding = st.text_input("Boarding point", value=auto_trip["boarding_point"])
    else:
        col1, col2 = st.columns(2)
        with col1:
            bus_no = st.text_input("Bus number")
            seat = st.text_input("Seat number")
        with col2:
            route = st.text_input("Route")
            boarding = st.text_input("Boarding point")

    phone = st.text_input("Phone number (for delivery contact)")
    notes = st.text_area("Special instructions (e.g., no onion, allergic to nuts)")

    st.write("---")
    st.subheader("Confirm & Place Order")
    if st.button("Place Order"):
        if not st.session_state.get("cart"):
            st.error("Your cart is empty. Add items before placing an order.")
        elif not phone or not bus_no or not seat:
            st.error("Please fill phone, bus number and seat number.")
        else:
            order = {}
            order["order_id"] = generate_order_id()
            order["placed_at"] = str(datetime.datetime.now())
            order["bus_no"] = bus_no
            order["seat"] = seat
            order["route"] = route
            order["boarding_point"] = boarding
            order["phone"] = phone
            order["notes"] = notes
            order["delivery_mode"] = mode
            order["schedule"] = scheduled
            order["items"] = st.session_state["cart"]
            order["subtotal"] = sum([i["price"]*i["qty"] for i in order["items"]])
            order["tax"] = round(order["subtotal"] * 0.05, 2)
            order["total"] = order["subtotal"] + order["tax"]
            order["status"] = "received"
            save_order(order)
            st.success(f\"Order placed — ID: {order['order_id']} — Total {format_currency(order['total'])}\")
            st.json({"order_id":order["order_id"], "total": format_currency(order["total"])})
            # clear cart
            st.session_state["cart"] = []

def orders_history_ui():
    st.subheader("Your past orders (local)")
    orders = load_orders()
    if not orders:
        st.info("No orders found.")
        return
    df = pd.json_normalize(orders, sep="_")
    # show limited columns
    show_cols = ["order_id","placed_at","bus_no","seat","delivery_mode","subtotal","tax","total","status"]
    for c in show_cols:
        if c not in df.columns:
            df[c] = ""
    df_display = df[show_cols].copy()
    df_display["subtotal"] = df_display["subtotal"].apply(lambda x: format_currency(float(x)) if x!="" else "")
    df_display["tax"] = df_display["tax"].apply(lambda x: format_currency(float(x)) if x!="" else "")
    df_display["total"] = df_display["total"].apply(lambda x: format_currency(float(x)) if x!="" else "")
    st.dataframe(df_display.sort_values("placed_at", ascending=False).reset_index(drop=True))

def main():
    st.set_page_config(page_title="Food On Bus — Passenger", layout="wide")
    app_header()
    auto_trip = choose_trip_ui()
    c1, c2 = st.columns([2,1])
    with c1:
        menu_ui()
        order_builder_ui(auto_trip)
    with c2:
        st.markdown("## Quick actions")
        if st.button("View past orders"):
            st.session_state["view_orders"] = True
        if st.session_state.get("view_orders", False):
            orders_history_ui()
        st.write("---")
        st.markdown("## Help & Info")
        st.write("- Eat Now: delivered at next stop (we aim to deliver within prep+stop time).")
        st.write("- Eat Later: schedule at a listed stop/time.")
        st.write("- Eat Tomorrow: schedule for next-day deliveries (overnight buses).")
        st.write("---")
        st.markdown("### Support")
        st.write("For issues, contact: support@foodonbus.example (simulated)")
    st.write("---")
    st.markdown("### Developer notes")
    st.write("- This is a simulated local Streamlit app useful for prototyping.")
    st.write(f"- Orders are stored at `{ORDERS_FILE}` on the server (local sandbox).")
    st.write("- To expand: integrate payments, real-time driver tracking, and a backend DB.")
    st.write("")
    st.caption("Food On Bus — Passenger app prototype")

if __name__ == '__main__':
    main()
