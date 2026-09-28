from fastapi import FastAPI
from app.routers import (
    user,
    shift,
    product,
    par_level,
    recipe,
    recipe_ingredient,
    order,
    stock_loss,
    report,
)

app = FastAPI(title="BarStock API")

app.include_router(user.router)
app.include_router(shift.router)
app.include_router(product.router)
app.include_router(par_level.router)
app.include_router(recipe.router)
app.include_router(recipe_ingredient.router)
app.include_router(order.router)
app.include_router(stock_loss.router)
app.include_router(report.router)


@app.get("/")
def read_root():
    return {"message": "BarStock API is running"}