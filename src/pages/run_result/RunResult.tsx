import React from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  message,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography
} from "antd";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dracula} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {useQuery} from "@tanstack/react-query";
import {Link, useParams} from "react-router";
import useAxios from "../../context/auth/axios.ts";
import {isOk} from "../../utils/axios.ts";
import {PageContainer} from "../../components/PageWrapper/PageWrapper.tsx";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  PauseCircleOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined
} from "@ant-design/icons";
import {dayjs} from "../../utils/dayjs.ts";
import {colors} from "../../theme/theme.ts";

interface ProjectAnalysisRun {
  id: number;
  run_id: string;
  dir: string;
  type: string;
  drifted: boolean;
  succeeded: boolean;
  init_output: string;
  plan_output: string;
  skipped_due_to_pr: boolean;
}

interface AnalysisRun {
  uuid: string;
  repository_id: number;
  total_projects: number;
  total_projects_drifted: number;
  total_projects_skipped: number;
  duration_millis: number;
  created_at: string;
  updated_at: string;
  projects: ProjectAnalysisRun[];
}

type StatusFilter = 'all' | 'drifted' | 'errored' | 'skipped' | 'ok';

const RunResultPage: React.FC = () => {
  const [searchText, setSearchText] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<ProjectAnalysisRun | null>(null);
  const hasInitializedFilter = React.useRef(false);

  const axios = useAxios();
  const {org: orgName, repo: repoName, run: runUuid} = useParams();

  const runQuery = useQuery({
    queryKey: ["getRun", runUuid],
    enabled: !!runUuid,
    queryFn: async () => {
      const response = await axios.get<AnalysisRun>(`/v1/analysis/run/${runUuid}`);
      if (!isOk(response)) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    }
  });

  const run = runQuery.data;

  // Set default filter based on priority: drifted > errored > skipped > all (on initial load)
  React.useEffect(() => {
    if (run && !hasInitializedFilter.current) {
      hasInitializedFilter.current = true;
      const driftedCount = run.projects?.filter(p => p.drifted && !p.skipped_due_to_pr && p.succeeded).length ?? 0;
      const erroredCount = run.projects?.filter(p => !p.succeeded).length ?? 0;
      const skippedCount = run.projects?.filter(p => p.skipped_due_to_pr && p.succeeded).length ?? 0;

      if (driftedCount > 0) {
        setStatusFilter('drifted');
      } else if (erroredCount > 0) {
        setStatusFilter('errored');
      } else if (skippedCount > 0) {
        setStatusFilter('skipped');
      }
      // If no drifted, errored, or skipped projects, keep the default 'all' filter
    }
  }, [run]);
  const allProjects = React.useMemo(() => run?.projects ?? [], [run?.projects]);

  // Filter projects based on search text and status filter
  const filteredProjects = React.useMemo(() => {
    return allProjects.filter((project) => {
      // Text filter
      const matchesSearch = searchText === '' ||
        project.dir.toLowerCase().includes(searchText.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'drifted') {
        matchesStatus = project.drifted && !project.skipped_due_to_pr && project.succeeded;
      } else if (statusFilter === 'errored') {
        matchesStatus = !project.succeeded;
      } else if (statusFilter === 'skipped') {
        matchesStatus = project.skipped_due_to_pr && project.succeeded;
      } else if (statusFilter === 'ok') {
        matchesStatus = !project.drifted && !project.skipped_due_to_pr && project.succeeded;
      }

      return matchesSearch && matchesStatus;
    });
  }, [allProjects, searchText, statusFilter]);

  // Calculate counts for filter badges
  const counts = React.useMemo(() => {
    const drifted = allProjects.filter(p => p.drifted && !p.skipped_due_to_pr && p.succeeded).length;
    const errored = allProjects.filter(p => !p.succeeded).length;
    const skipped = allProjects.filter(p => p.skipped_due_to_pr && p.succeeded).length;
    const ok = allProjects.filter(p => !p.drifted && !p.skipped_due_to_pr && p.succeeded).length;
    return {drifted, errored, skipped, ok, all: allProjects.length};
  }, [allProjects]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Output copied to clipboard');
    } catch {
      message.error('Failed to copy output');
    }
  };

  const openProjectDrawer = (project: ProjectAnalysisRun) => {
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedProject(null);
  };

  const getProjectStatus = (project: ProjectAnalysisRun) => {
    if (!project.succeeded) {
      return {tag: <Tag icon={<ExclamationCircleOutlined/>} color={colors.error}>Error</Tag>, label: 'Error'};
    }
    if (project.skipped_due_to_pr) {
      return {tag: <Tag icon={<PauseCircleOutlined/>} color="blue">Skipped (PR)</Tag>, label: 'Skipped'};
    }
    if (project.drifted) {
      return {tag: <Tag icon={<WarningOutlined/>} color={colors.warning}>Drifted</Tag>, label: 'Drifted'};
    }
    return {tag: <Tag icon={<CheckCircleOutlined/>} color={colors.success}>OK</Tag>, label: 'OK'};
  };

  const columns = [
    {
      title: 'Project',
      dataIndex: 'dir',
      key: 'dir',
      ellipsis: true,
      sorter: (a: ProjectAnalysisRun, b: ProjectAnalysisRun) => a.dir.localeCompare(b.dir),
      render: (dir: string) => (
        <Tooltip title={dir}>
          <Typography.Text code style={{fontSize: '12px'}}>{dir}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      defaultSortOrder: 'ascend' as const,
      sorter: (a: ProjectAnalysisRun, b: ProjectAnalysisRun) => {
        const getStatusOrder = (p: ProjectAnalysisRun) => {
          if (!p.succeeded) return 0; // Error first
          if (p.skipped_due_to_pr) return 2; // Skipped third
          if (p.drifted) return 1; // Drifted second
          return 3; // OK last
        };
        return getStatusOrder(a) - getStatusOrder(b);
      },
      render: (_: React.ReactNode, record: ProjectAnalysisRun) => getProjectStatus(record).tag,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      sorter: (a: ProjectAnalysisRun, b: ProjectAnalysisRun) => a.type.localeCompare(b.type),
      render: (type: string) => (
        <Tag>{type}</Tag>
      ),
    },
  ];

  const shortUuid = runUuid?.slice(0, 8) ?? '';
  const selectedOutput = selectedProject?.plan_output || selectedProject?.init_output || 'No output available';

  return (
    <PageContainer>
      <Card
        style={{borderRadius: 12}}
        styles={{body: {padding: 32}}}
      >
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {title: <Link to={`/gh/${orgName}`}>{orgName}</Link>},
            {title: <Link to={`/gh/${orgName}/${repoName}`}>{repoName}</Link>},
            {title: `Run ${shortUuid}...`},
          ]}
          style={{marginBottom: 16}}
        />

        {/* Header with title and stats */}
        <Typography.Title level={4} style={{marginBottom: 16}}>
          Analysis Run
        </Typography.Title>

        {runQuery.isLoading ? (
          <Row gutter={[16, 16]} style={{marginBottom: 24}}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} md={6} key={i}>
                <Card size="small" style={{borderRadius: 8}}>
                  <Skeleton.Input active style={{width: '100%', height: 50}} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : run && (
          <Row gutter={[16, 16]} style={{marginBottom: 24}}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{borderRadius: 8, height: '100%'}}>
                <Statistic
                  title={<span style={{fontSize: 12, color: colors.textSecondary}}>Total Projects</span>}
                  value={run.total_projects}
                  prefix={<ProjectOutlined style={{color: colors.primary}} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{
                  borderRadius: 8,
                  height: '100%',
                  borderColor: run.total_projects_drifted > 0 ? colors.error : colors.success,
                  backgroundColor: run.total_projects_drifted > 0 ? colors.errorBg : colors.successBg,
                }}
              >
                <Statistic
                  title={<span style={{fontSize: 12, color: colors.textSecondary}}>Drifted</span>}
                  value={run.total_projects_drifted}
                  valueStyle={{color: run.total_projects_drifted > 0 ? colors.error : colors.success}}
                  prefix={<WarningOutlined style={{color: run.total_projects_drifted > 0 ? colors.error : colors.success}} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{borderRadius: 8, height: '100%'}}>
                <Statistic
                  title={<span style={{fontSize: 12, color: colors.textSecondary}}>Duration</span>}
                  value={dayjs.duration({milliseconds: run.duration_millis}).asSeconds().toFixed(1)}
                  suffix="s"
                  prefix={<ClockCircleOutlined style={{color: colors.primary}} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Tooltip title={dayjs(run.created_at).format('lll')}>
                <Card size="small" style={{borderRadius: 8, height: '100%'}}>
                  <Statistic
                    title={<span style={{fontSize: 12, color: colors.textSecondary}}>Run Date</span>}
                    value={dayjs(run.created_at).fromNow()}
                    prefix={<ClockCircleOutlined style={{color: colors.primary}} />}
                  />
                </Card>
              </Tooltip>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Space orientation="vertical" style={{width: '100%', marginBottom: 16}} size="middle">
          <Space wrap>
            <Input
              placeholder="Filter by project path..."
              prefix={<SearchOutlined aria-hidden="true" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{width: 300}}
              aria-label="Filter projects by path"
            />
            <Segmented
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={[
                {label: `All (${counts.all})`, value: 'all'},
                {label: `Drifted (${counts.drifted})`, value: 'drifted'},
                {label: `Errored (${counts.errored})`, value: 'errored'},
                {label: `Skipped (${counts.skipped})`, value: 'skipped'},
                {label: `OK (${counts.ok})`, value: 'ok'},
              ]}
            />
          </Space>
          {searchText && (
            <Typography.Text type="secondary">
              Showing {filteredProjects.length} of {allProjects.length} projects
            </Typography.Text>
          )}
        </Space>

        {/* Error State */}
        {runQuery.isError && (
          <Alert
            title="Failed to load analysis run"
            description="We couldn't fetch the analysis run details. Please check your connection and try again."
            type="error"
            showIcon
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => runQuery.refetch()}
              >
                Retry
              </Button>
            }
            style={{marginBottom: 16}}
          />
        )}

        {/* Table */}
        {!runQuery.isError && (
          <Table
            dataSource={filteredProjects}
            columns={columns}
            loading={runQuery.isLoading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
            }}
            rowClassName="clickable-row"
            onRow={(record) => ({
              onClick: () => openProjectDrawer(record),
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openProjectDrawer(record);
                }
              },
              style: {cursor: 'pointer'},
              tabIndex: 0,
              role: 'button',
              'aria-label': `View output for ${record.dir}`,
            })}
            size="middle"
            locale={{
              emptyText: searchText || statusFilter !== 'all' ? (
                <Empty
                  image={<FilterOutlined style={{fontSize: 48, color: '#bfbfbf'}} />}
                  description={
                    <Space orientation="vertical" size="small">
                      <Typography.Text>No projects match your filters</Typography.Text>
                      <Typography.Text type="secondary">
                        Try adjusting your search or status filter
                      </Typography.Text>
                    </Space>
                  }
                >
                  <Button onClick={() => { setSearchText(''); setStatusFilter('all'); }}>
                    Clear Filters
                  </Button>
                </Empty>
              ) : (
                <Empty description="No projects in this analysis run" />
              )
            }}
          />
        )}

        {/* Output Drawer */}
        <Drawer
          title={
            selectedProject ? (
              <Space orientation="vertical" size="small" style={{width: '100%'}}>
                <Space>
                  {getProjectStatus(selectedProject).tag}
                  <Tag>{selectedProject.type}</Tag>
                </Space>
                <Typography.Text code style={{fontSize: '12px', wordBreak: 'break-all'}}>
                  {selectedProject.dir}
                </Typography.Text>
              </Space>
            ) : 'Project Output'
          }
          placement="right"
          width={Math.min(1000, window.innerWidth * 0.9)}
          onClose={closeDrawer}
          open={drawerOpen}
          extra={
            <Button
              icon={<CopyOutlined aria-hidden="true" />}
              onClick={() => copyToClipboard(selectedOutput)}
              aria-label="Copy output to clipboard"
            >
              Copy
            </Button>
          }
        >
          {selectedProject && (
            <div style={{height: '100%', overflow: 'auto'}}>
              <SyntaxHighlighter
                language="hcl"
                style={dracula}
                customStyle={{margin: 0, borderRadius: '8px', minHeight: '100%'}}
              >
                {selectedOutput}
              </SyntaxHighlighter>
            </div>
          )}
        </Drawer>
      </Card>
    </PageContainer>
  );
}

export default RunResultPage;
