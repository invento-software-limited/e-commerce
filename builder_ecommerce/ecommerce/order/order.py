import frappe


@frappe.whitelist()
def cancel_order(order_id):
    try:
        sales_order = frappe.get_doc("Sales Order", order_id)

        if sales_order.docstatus == 2:
            return {"status": "error", "message": "Sales Order is already canceled"}

        sales_order.cancel()

        return {"status": "success", "message": f"Sales Order {order_id} has been canceled"}

    except frappe.DoesNotExistError:
        return {"status": "error", "message": "Sales Order not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
