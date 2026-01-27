#!/usr/bin/env python3
"""
Cold Email Outreach System CLI
Automate personalized cold emails to recruiters.
"""

import click
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Confirm
from rich import print as rprint

from src.data_processor import DataProcessor
from src.email_generator import EmailGenerator
from src.tracker import EmailTracker
from src.gmail_client import GmailClient
from src.utils import load_env


def get_generator(use_llm: bool = False):
    """Get the appropriate email generator."""
    if use_llm:
        from src.llm_generator import LLMEmailGenerator
        return LLMEmailGenerator()
    return EmailGenerator()


console = Console()


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """Cold Email Outreach System - Automate personalized recruiter emails."""
    pass


@cli.command()
@click.option('--input', '-i', 'input_file', required=True, help='Path to CSV/JSON file with recruiter data')
@click.option('--template', '-t', default='professional', help='Email template (professional/concise)')
@click.option('--limit', '-l', default=None, type=int, help='Limit number of emails to preview')
@click.option('--llm', is_flag=True, help='Use Gemini LLM for personalized generation')
def preview(input_file: str, template: str, limit: int, llm: bool):
    """Preview generated emails without sending."""
    mode_text = "🤖 LLM Preview Mode" if llm else "📧 Email Preview Mode"
    console.print(Panel.fit(mode_text, style="bold blue"))
    
    # Load data
    processor = DataProcessor()
    recruiters = processor.load(input_file)
    
    if limit:
        recruiters = recruiters[:limit]
    
    console.print(f"Loaded {len(recruiters)} recruiters from {input_file}")
    
    # Filter already contacted
    tracker = EmailTracker()
    recruiters = tracker.filter_unsent(recruiters)
    console.print(f"After filtering: {len(recruiters)} new contacts")
    
    if not recruiters:
        console.print("[yellow]No new recruiters to contact![/yellow]")
        return
    
    # Generate emails
    generator = get_generator(use_llm=llm)
    
    for i, recruiter in enumerate(recruiters, 1):
        preview = generator.preview_email(recruiter, template)
        console.print(f"\n[bold cyan]Email {i}/{len(recruiters)}[/bold cyan]")
        console.print(preview)
        
        if i < len(recruiters):
            if not Confirm.ask("Continue to next email?", default=True):
                break


@cli.command()
@click.option('--input', '-i', 'input_file', required=True, help='Path to CSV/JSON file')
@click.option('--template', '-t', default='professional', help='Email template')
@click.option('--attachment', '-a', default=None, help='Path to resume attachment')
@click.option('--llm', is_flag=True, help='Use Gemini LLM for personalized generation')
def draft(input_file: str, template: str, attachment: str, llm: bool):
    """Create Gmail drafts for review before sending."""
    mode_text = "🤖 LLM Draft Mode" if llm else "📝 Draft Creation Mode"
    console.print(Panel.fit(mode_text, style="bold yellow"))
    
    # Load and process
    processor = DataProcessor()
    recruiters = processor.load(input_file)
    
    tracker = EmailTracker()
    recruiters = tracker.filter_unsent(recruiters)
    
    console.print(f"Creating drafts for {len(recruiters)} recruiters")
    
    if not recruiters:
        console.print("[yellow]No new recruiters to contact![/yellow]")
        return
    
    # Confirm
    if not Confirm.ask(f"Create {len(recruiters)} drafts in Gmail?"):
        console.print("Cancelled.")
        return
    
    # Generate emails
    generator = get_generator(use_llm=llm)
    gmail = GmailClient()
    
    if not gmail.authenticate():
        console.print("[red]Gmail authentication failed![/red]")
        return
    
    success = 0
    failed = 0
    
    for i, recruiter in enumerate(recruiters, 1):
        console.print(f"[{i}/{len(recruiters)}] {recruiter.get('company')}...")
        
        try:
            result = generator.generate(recruiter, template)
            subject = result["subject"]
            body = result["body"]
            draft_result = gmail.create_draft(
                recruiter['recruiter_email'],
                subject,
                body,
                attachment
            )
            
            if draft_result:
                tracker.add_record(recruiter, 'draft', subject, draft_result.get('id'))
                success += 1
                console.print(f"  [green]✓ Draft created[/green]")
            else:
                tracker.add_record(recruiter, 'failed', subject)
                failed += 1
                console.print(f"  [red]✗ Failed[/red]")
        except Exception as e:
            failed += 1
            console.print(f"  [red]✗ Error: {e}[/red]")
    
    console.print(f"\n[bold]Results:[/bold] {success} drafts created, {failed} failed")
    console.print("[yellow]Check your Gmail Drafts folder to review and send![/yellow]")


@cli.command()
@click.option('--input', '-i', 'input_file', required=True, help='Path to CSV/JSON file')
@click.option('--template', '-t', default='professional', help='Email template')
@click.option('--delay', '-d', default=30, type=int, help='Delay between emails (seconds)')
@click.option('--attachment', '-a', default=None, help='Path to resume attachment')
@click.option('--dry-run', is_flag=True, help='Simulate without sending')
def send(input_file: str, template: str, delay: int, attachment: str, dry_run: bool):
    """Send emails directly with rate limiting."""
    mode = "DRY RUN" if dry_run else "SEND"
    console.print(Panel.fit(f"🚀 {mode} Mode", style="bold green" if not dry_run else "bold magenta"))
    
    # Load and process
    processor = DataProcessor()
    recruiters = processor.load(input_file)
    
    tracker = EmailTracker()
    recruiters = tracker.filter_unsent(recruiters)
    
    console.print(f"Emails to send: {len(recruiters)}")
    console.print(f"Delay between emails: {delay}s")
    
    if not recruiters:
        console.print("[yellow]No new recruiters to contact![/yellow]")
        return
    
    # Confirm
    if not dry_run:
        if not Confirm.ask(f"[bold red]Send {len(recruiters)} emails now?[/bold red]"):
            console.print("Cancelled.")
            return
    
    # Generate and send
    generator = EmailGenerator()
    gmail = GmailClient()
    
    if not dry_run and not gmail.authenticate():
        console.print("[red]Gmail authentication failed![/red]")
        return
    
    success = 0
    failed = 0
    
    for i, recruiter in enumerate(recruiters, 1):
        console.print(f"[{i}/{len(recruiters)}] {recruiter.get('company')} - {recruiter.get('recruiter_email')}")
        
        try:
            result = generator.generate(recruiter, template)
            subject = result["subject"]
            body = result["body"]
            
            if dry_run:
                console.print(f"  [magenta]Would send: {subject[:50]}...[/magenta]")
                tracker.add_record(recruiter, 'pending', subject)
                success += 1
            else:
                result = gmail.send_email(
                    recruiter['recruiter_email'],
                    subject,
                    body,
                    attachment
                )
                
                if result:
                    tracker.add_record(recruiter, 'sent', subject, result.get('id'))
                    success += 1
                    console.print(f"  [green]✓ Sent[/green]")
                else:
                    tracker.add_record(recruiter, 'failed', subject)
                    failed += 1
                    console.print(f"  [red]✗ Failed[/red]")
            
            # Rate limiting
            if i < len(recruiters) and not dry_run and delay > 0:
                console.print(f"  [dim]Waiting {delay}s...[/dim]")
                import time
                time.sleep(delay)
                
        except Exception as e:
            failed += 1
            console.print(f"  [red]✗ Error: {e}[/red]")
    
    console.print(f"\n[bold]Results:[/bold] {success} sent, {failed} failed")


@cli.command()
@click.option('--status', '-s', default=None, help='Filter by status (pending/draft/sent/failed)')
@click.option('--export', '-e', 'export_path', default=None, help='Export to CSV')
def history(status: str, export_path: str):
    """View email sending history."""
    console.print(Panel.fit("📊 Email History", style="bold blue"))
    
    tracker = EmailTracker()
    
    # Show stats
    stats = tracker.get_stats()
    table = Table(show_header=True)
    table.add_column("Status", style="bold")
    table.add_column("Count", justify="right")
    
    table.add_row("Total", str(stats['total']))
    table.add_row("[green]Sent[/green]", str(stats['sent']))
    table.add_row("[yellow]Draft[/yellow]", str(stats['draft']))
    table.add_row("[blue]Pending[/blue]", str(stats['pending']))
    table.add_row("[red]Failed[/red]", str(stats['failed']))
    
    console.print(table)
    
    # Export if requested
    if export_path:
        tracker.export_csv(export_path)
        console.print(f"[green]Exported to {export_path}[/green]")
        return
    
    # Show records
    records = tracker.get_all(status)
    
    if not records:
        console.print("[dim]No records found.[/dim]")
        return
    
    console.print(f"\n[bold]Recent emails ({len(records)} total):[/bold]\n")
    
    detail_table = Table(show_header=True)
    detail_table.add_column("Company")
    detail_table.add_column("Email")
    detail_table.add_column("Status")
    detail_table.add_column("Date")
    
    for record in records[:20]:  # Show last 20
        status_style = {
            'sent': 'green',
            'draft': 'yellow', 
            'pending': 'blue',
            'failed': 'red'
        }.get(record['status'], 'white')
        
        detail_table.add_row(
            record.get('company', '')[:25],
            record.get('recruiter_email', '')[:30],
            f"[{status_style}]{record['status']}[/{status_style}]",
            record.get('updated_at', '')[:10]
        )
    
    console.print(detail_table)


@cli.command()
def templates():
    """List available email templates."""
    console.print(Panel.fit("📄 Available Templates", style="bold blue"))
    
    generator = EmailGenerator()
    templates = generator.get_available_templates()
    
    for name in templates:
        console.print(f"  • {name}")
    
    console.print("\n[dim]Use --template/-t flag to select a template[/dim]")


@cli.command()
def stats():
    """Show data statistics."""
    console.print(Panel.fit("📈 Statistics", style="bold blue"))
    
    tracker = EmailTracker()
    stats = tracker.get_stats()
    
    console.print(f"Total emails tracked: [bold]{stats['total']}[/bold]")
    console.print(f"  Sent: [green]{stats['sent']}[/green]")
    console.print(f"  Drafts: [yellow]{stats['draft']}[/yellow]")
    console.print(f"  Pending: [blue]{stats['pending']}[/blue]")
    console.print(f"  Failed: [red]{stats['failed']}[/red]")


@cli.command()
def auth():
    """Test Gmail API authentication."""
    console.print(Panel.fit("🔐 Gmail Authentication", style="bold blue"))
    
    gmail = GmailClient()
    if gmail.test_connection():
        console.print("[green]Authentication successful![/green]")
    else:
        console.print("[red]Authentication failed. See instructions above.[/red]")


if __name__ == "__main__":
    cli()
