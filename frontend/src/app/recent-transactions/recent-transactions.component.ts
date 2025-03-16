import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../dasboard/badge/badge.component';

interface Product {
  id: number;
  name: string;
  variants: string;
  category: string;
  price: string;
  status: 'Delivered' | 'Pending' | 'Canceled';
  image: string;
}

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './recent-transactions.component.html'
})
export class RecentTransactionsComponent {
  tableData: Product[] = [
    {
      id: 1,
      name: "MacBook Pro 13",
      variants: "2 Variants",
      category: "Laptop",
      price: "$2399.00",
      status: "Delivered",
      image: "/assets/images/product/product-01.jpg",
    },
    {
      id: 2,
      name: "Apple Watch Ultra",
      variants: "1 Variant",
      category: "Watch",
      price: "$879.00",
      status: "Pending",
      image: "/assets/images/product/product-02.jpg",
    },
    {
      id: 3,
      name: "iPhone 15 Pro Max",
      variants: "2 Variants",
      category: "SmartPhone",
      price: "$1869.00",
      status: "Delivered",
      image: "/assets/images/product/product-03.jpg",
    },
    {
      id: 4,
      name: "iPad Pro 3rd Gen",
      variants: "2 Variants",
      category: "Electronics",
      price: "$1699.00",
      status: "Canceled",
      image: "/assets/images/product/product-04.jpg",
    },
    {
      id: 5,
      name: "AirPods Pro 2nd Gen",
      variants: "1 Variant",
      category: "Accessories",
      price: "$240.00",
      status: "Delivered",
      image: "/assets/images/product/product-05.jpg",
    }
  ];

  getBadgeColor(status: string): 'success' | 'warning' | 'error' {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Canceled':
        return 'error';
      default:
        return 'error';
    }
  }
}
