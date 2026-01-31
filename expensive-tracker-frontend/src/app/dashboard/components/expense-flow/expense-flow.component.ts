import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';
import { WalletService } from '../../../services/wallet.service';

interface FlowNode {
  id: string;
  name: string;
  type: 'wallet' | 'category';
  color: string;
  x: number;
  y: number;
  height: number;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
  color: string;
  path: string;
  strokeWidth: number;
}

@Component({
  selector: 'app-expense-flow',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './expense-flow.component.html',
  styleUrl: './expense-flow.component.css'
})
export class ExpenseFlowComponent implements OnInit {
  faChartPie = faChartPie;
  nodes: FlowNode[] = [];
  links: FlowLink[] = [];
  isLoading = true;
  private readonly svgWidth = 1000;
  private readonly svgHeight = 400;

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.walletService.getExpenseFlow().subscribe({
      next: (data) => {
        this.processFlowData(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching flow data:', err);
        this.isLoading = false;
      }
    });
  }

  private processFlowData(data: any) {
    const { links, nodes } = data;
    const width = 1000;
    const height = 400;
    const nodeWidth = 12;
    const padding = 160; // Increased padding to accommodate labels
    const verticalGap = 15;

    // Filter nodes to only those that have links
    const activeWalletIds = new Set(links.map((l: any) => l.sourceId));
    const activeCategoryIds = new Set(links.map((l: any) => l.targetId));

    const activeNodesData = nodes.filter((n: any) => 
      (n.type === 'wallet' && activeWalletIds.has(n.id)) || 
      (n.type === 'category' && activeCategoryIds.has(n.id))
    );

    const wallets = activeNodesData.filter((n: any) => n.type === 'wallet');
    const categories = activeNodesData.filter((n: any) => n.type === 'category');

    // Calculate total values
    const walletTotals: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    links.forEach((l: any) => {
      walletTotals[l.sourceId] = (walletTotals[l.sourceId] || 0) + l.value;
      categoryTotals[l.targetId] = (categoryTotals[l.targetId] || 0) + l.value;
    });

    const totalFlow = Object.values(walletTotals).reduce((a, b) => a + b, 0);

    if (totalFlow === 0) return;

    // Position nodes
    const availableHeight = height - (padding * 2);
    const totalGapsWallets = Math.max(0, wallets.length - 1) * verticalGap;
    const totalGapsCategories = Math.max(0, categories.length - 1) * verticalGap;
    
    // Scale value to height
    const scaleY = (val: number, gaps: number) => (val / totalFlow) * (availableHeight - gaps);

    let currentY = padding;
    wallets.forEach((w: any) => {
      const nodeHeight = Math.max(scaleY(walletTotals[w.id], totalGapsWallets), 4);
      this.nodes.push({
        ...w,
        x: padding,
        y: currentY,
        height: nodeHeight
      });
      currentY += nodeHeight + verticalGap;
    });

    currentY = padding;
    categories.forEach((c: any) => {
      const nodeHeight = Math.max(scaleY(categoryTotals[c.id], totalGapsCategories), 4);
      this.nodes.push({
        ...c,
        x: width - padding - nodeWidth,
        y: currentY,
        height: nodeHeight
      });
      currentY += nodeHeight + verticalGap;
    });

    // Create links
    const walletOffsets: Record<string, number> = {};
    const categoryOffsets: Record<string, number> = {};

    links.forEach((link: any) => {
      const sourceNode = this.nodes.find(n => n.id === link.sourceId);
      const targetNode = this.nodes.find(n => n.id === link.targetId);

      if (sourceNode && targetNode) {
        const linkHeight = (link.value / totalFlow) * (availableHeight - Math.min(totalGapsWallets, totalGapsCategories));
        
        const sourceY = sourceNode.y + (walletOffsets[link.sourceId] || 0);
        const targetY = targetNode.y + (categoryOffsets[link.targetId] || 0);

        const x0 = sourceNode.x + nodeWidth;
        const x1 = targetNode.x;
        const xm = (x0 + x1) / 2;
        
        const path = `M ${x0} ${sourceY + linkHeight/2} C ${xm} ${sourceY + linkHeight/2}, ${xm} ${targetY + linkHeight/2}, ${x1} ${targetY + linkHeight/2}`;

        this.links.push({
          source: link.source,
          target: link.target,
          value: link.value,
          color: link.color || '#6366f1',
          path,
          strokeWidth: Math.max(linkHeight, 1)
        });

        walletOffsets[link.sourceId] = (walletOffsets[link.sourceId] || 0) + linkHeight;
        categoryOffsets[link.targetId] = (categoryOffsets[link.targetId] || 0) + linkHeight;
      }
    });
  }

  getLabelX(node: FlowNode): number {
    const leftMargin = 120; // Space for wallet labels on the left
    const rightMargin = 120; // Space for category labels on the right
    
    if (node.type === 'wallet') {
      // For wallet labels (positioned to the left of the node)
      const idealX = node.x - 15;
      // Ensure label doesn't go beyond left margin
      return Math.max(leftMargin, idealX);
    } else {
      // For category labels (positioned to the right of the node)  
      const idealX = node.x + 27;
      // Ensure label doesn't go beyond right margin
      return Math.min(this.svgWidth - rightMargin, idealX);
    }
  }

  getLabelAnchor(node: FlowNode): string {
    const leftMargin = 120;
    const rightMargin = 120;
    
    if (node.type === 'wallet') {
      // For wallet labels - if we had to move it right due to margin, use start anchor
      const idealX = node.x - 15;
      return idealX < leftMargin ? 'start' : 'end';
    } else {
      // For category labels - if we had to move it left due to margin, use end anchor  
      const idealX = node.x + 27;
      return idealX > this.svgWidth - rightMargin ? 'end' : 'start';
    }
  }
}
