from app import db
from datetime import datetime
from flask_login import UserMixin


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user")  # admin / user
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    drawings = db.relationship("Drawing", backref="creator", lazy=True)
    deliveries = db.relationship("Delivery", backref="registrar", lazy=True)
    photos = db.relationship("Photo", backref="uploader", lazy=True)


class Drawing(db.Model):
    __tablename__ = "drawings"

    id = db.Column(db.Integer, primary_key=True)
    project_no = db.Column(db.String(50), nullable=False)   # 工事番号
    drawing_no = db.Column(db.String(50), nullable=False)   # 図面番号
    vendor = db.Column(db.String(200), nullable=False)      # 発注先
    order_date = db.Column(db.Date, nullable=False)         # 発注日
    due_date = db.Column(db.Date, nullable=False)           # 納期
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    delivery = db.relationship("Delivery", backref="drawing", uselist=False, lazy=True)


class Photo(db.Model):
    __tablename__ = "photos"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)          # 保存ファイル名
    original_filename = db.Column(db.String(255), nullable=False) # 元のファイル名
    filepath = db.Column(db.String(500), nullable=False)          # static/uploads/...
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    deliveries = db.relationship("Delivery", backref="photo", lazy=True)


class Delivery(db.Model):
    __tablename__ = "deliveries"

    id = db.Column(db.Integer, primary_key=True)
    drawing_id = db.Column(db.Integer, db.ForeignKey("drawings.id"), nullable=False)
    photo_id = db.Column(db.Integer, db.ForeignKey("photos.id"), nullable=True)
    delivered_at = db.Column(db.Date, nullable=True)  # 納入日（写真登録日）
    registered_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
