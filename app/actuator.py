from abc import ABC, abstractmethod

from .models import Action


class Actuator(ABC):
    """Hardware-independent interface for ClassWatch actuation."""

    @abstractmethod
    def execute(self, room_id: str, device: str, action: Action) -> bool:
        raise NotImplementedError


class VirtualActuator(Actuator):
    """
    Software actuator used for the hackathon demo.

    It exposes the same interface that a real smart-plug implementation
    will use, allowing hardware to be added without changing the API.
    """

    def __init__(self):
        self.device_states: dict[str, str] = {}

    def execute(self, room_id: str, device: str, action: Action) -> bool:
        key = f"{room_id}:{device}"
        self.device_states[key] = action.value
        return True

    def get_state(self, room_id: str, device: str) -> str:
        return self.device_states.get(
            f"{room_id}:{device}",
            "unknown",
        )

    def all_states(self) -> dict[str, str]:
        return self.device_states.copy()
