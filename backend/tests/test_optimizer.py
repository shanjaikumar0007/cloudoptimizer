import pytest
from app.services import classify_resource, generate_recommendation

def test_classify_idle():
    """
    Test 1: Backend Unit Test
    Verify that classify_resource(5, 5, 5, 5) returns 'Idle'
    """
    assert classify_resource(5, 5, 5, 5) == "Idle"

def test_classify_underutilized():
    """
    Verify average < 40% returns Underutilized
    """
    assert classify_resource(25, 30, 20, 25) == "Underutilized"

def test_classify_active():
    """
    Verify average < 80% returns Active
    """
    assert classify_resource(60, 70, 50, 60) == "Active"

def test_classify_high_utilization():
    """
    Verify average >= 80% returns High Utilization
    """
    assert classify_resource(85, 90, 80, 85) == "High Utilization"

def test_recommendation_idle_stop():
    """
    Idle resources must trigger STOP_RESOURCE and full monthly savings (hourly * 730)
    """
    class MockResource:
        cpu_utilization = 5.0
        memory_utilization = 5.0
        storage_utilization = 5.0
        network_utilization = 5.0
        hourly_cost = 0.10

    rec = generate_recommendation(MockResource())
    assert rec["action"] == "STOP_RESOURCE"
    assert rec["status"] == "Idle"
    assert rec["savings"] == pytest.approx(73.0, 0.01)

def test_recommendation_underutilized_resize():
    """
    Underutilized resources must trigger CONSIDER_RESIZE with 40% savings
    """
    class MockResource:
        cpu_utilization = 25.0
        memory_utilization = 30.0
        storage_utilization = 20.0
        network_utilization = 25.0
        hourly_cost = 0.20

    rec = generate_recommendation(MockResource())
    assert rec["action"] == "CONSIDER_RESIZE"
    assert rec["status"] == "Underutilized"
    # Monthly = 0.20 * 730 = 146; 40% = 58.4
    assert rec["savings"] == pytest.approx(58.4, 0.01)

def test_sudden_workload_spike():
    """
    Test 4: Classification Logic under sudden spike
    If an idle resource (8% avg) suddenly spikes to 90%, recommendation must transition
    from STOP_RESOURCE to KEEP_RESOURCE.
    """
    class DynamicResource:
        hourly_cost = 0.12
        cpu_utilization = 8.0
        memory_utilization = 8.0
        storage_utilization = 8.0
        network_utilization = 8.0

    res = DynamicResource()
    idle_rec = generate_recommendation(res)
    assert idle_rec["action"] == "STOP_RESOURCE"

    # Spike workload
    res.cpu_utilization = 92.0
    res.memory_utilization = 88.0
    res.storage_utilization = 80.0
    res.network_utilization = 80.0

    spiked_rec = generate_recommendation(res)
    assert spiked_rec["action"] == "KEEP_RESOURCE"
    assert spiked_rec["status"] == "High Utilization"
