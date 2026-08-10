import os

# Demo defaults. These can be overridden with environment variables.
ELECTRICITY_RATE_INR_PER_KWH = float(
    os.getenv("ELECTRICITY_RATE_INR_PER_KWH", "8.0")
)

CO2_KG_PER_KWH = float(
    os.getenv("CO2_KG_PER_KWH", "0.79")
)

DEFAULT_SAVED_MINUTES = int(
    os.getenv("DEFAULT_SAVED_MINUTES", "20")
)

ACTUATOR_MODE = os.getenv("ACTUATOR_MODE", "virtual")
