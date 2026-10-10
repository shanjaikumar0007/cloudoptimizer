def classify_resource(cpu: float, mem: float, storage: float, net: float) -> str:
    """
    Classifies a cloud resource's status based on average utilization across 4 metrics:
    - Idle: avg < 15%
    - Underutilized: avg < 40%
    - Active: avg < 80%
    - High Utilization: avg >= 80%
    """
    avg = (cpu + mem + storage + net) / 4.0
    if avg < 15.0:
        return "Idle"
    if avg < 40.0:
        return "Underutilized"
    if avg < 80.0:
        return "Active"
    return "High Utilization"

def generate_recommendation(resource) -> dict:
    """
    Evaluates resource utilization and generates cost optimization recommendations:
    - Idle: suggest STOP_RESOURCE with 100% of monthly cost savings
    - Underutilized: suggest CONSIDER_RESIZE with ~40% monthly savings
    - Active / High: suggest KEEP_RESOURCE (0 savings)
    Monthly hours standard: 730 hours / month.
    """
    cpu = getattr(resource, "cpu_utilization", 0.0)
    mem = getattr(resource, "memory_utilization", 0.0)
    storage = getattr(resource, "storage_utilization", 0.0)
    net = getattr(resource, "network_utilization", 0.0)
    hourly_cost = getattr(resource, "hourly_cost", 0.0)

    status = classify_resource(cpu, mem, storage, net)
    monthly_cost = round(hourly_cost * 730.0, 2)
    avg_util = round((cpu + mem + storage + net) / 4.0, 1)

    if status == "Idle":
        return {
            "action": "STOP_RESOURCE",
            "status": "Idle",
            "reason": f"Average utilization is critically low at {avg_util}% (Idle threshold < 15%). Immediate decommission or stop suggested.",
            "savings": monthly_cost,
            "monthly_cost": monthly_cost
        }
    elif status == "Underutilized":
        savings = round(monthly_cost * 0.4, 2)  # Estimate 40% savings on resize
        return {
            "action": "CONSIDER_RESIZE",
            "status": "Underutilized",
            "reason": f"Resource average utilization is {avg_util}%, consistently below 40%. Downsize instance type to save ~40% cost.",
            "savings": savings,
            "monthly_cost": monthly_cost
        }
    elif status == "High Utilization":
        return {
            "action": "KEEP_RESOURCE",
            "status": "High Utilization",
            "reason": f"High utilization at {avg_util}%. Resource is heavily loaded. Consider scaling horizontally or adding alerting.",
            "savings": 0.0,
            "monthly_cost": monthly_cost
        }
    else:
        return {
            "action": "KEEP_RESOURCE",
            "status": "Active",
            "reason": f"Resource operating within healthy boundaries ({avg_util}% avg utilization). No action required.",
            "savings": 0.0,
            "monthly_cost": monthly_cost
        }
